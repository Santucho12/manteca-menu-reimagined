import { expect, test, type Page } from '@playwright/test';
import { SESIONES } from './ayudas';
import {
  borrarReportes,
  PERIODO_E2E,
  sembrarReportes,
  type SiembraDeReportes,
} from './reportes-de-prueba';

test.use({ storageState: SESIONES.admin });

let siembra: SiembraDeReportes;
test.beforeAll(async () => {
  siembra = await sembrarReportes();
});
test.afterAll(async () => {
  await borrarReportes(siembra);
});

const DE_ABRIL = `desde=${PERIODO_E2E.desde}&hasta=${PERIODO_E2E.hasta}`;
const TITULOS = [
  'Ventas por período',
  'Ventas por producto',
  'Ventas por categoría',
  'Gastos por categoría',
  'Gastos por período',
  'Caja',
  'Balance',
];
const nombreDe = (producto: { texto: string }) => producto.texto.split(' · ')[0]!;
const total = (page: Page, texto: string) =>
  page.getByRole('definition').filter({ hasText: texto }).first();

test('la lista lleva a cada reporte', async ({ page }) => {
  await page.goto('/admin/reportes');
  await expect(page.getByRole('heading', { level: 1, name: 'Reportes' })).toBeVisible();
  const lista = page.getByRole('main').getByRole('list');
  for (const titulo of TITULOS) {
    await expect(lista.getByRole('link', { name: titulo, exact: true })).toBeVisible();
  }
});

test('ventas por periodo: elige las fechas y ve el total, el ticket y la variacion', async ({
  page,
}) => {
  await page.goto('/admin/reportes/ventas');
  await page.getByLabel('Desde', { exact: true }).fill(PERIODO_E2E.desde);
  await page.getByLabel('Hasta', { exact: true }).fill(PERIODO_E2E.hasta);
  await expect(page).toHaveURL(new RegExp(DE_ABRIL));
  await expect(total(page, '$5.000,00')).toBeVisible();
  await expect(page.getByText('+$2.500,00 (+100 %)')).toBeVisible();
  await expect(total(page, '$2.500,00')).toBeVisible();
  await expect(page.getByRole('row', { name: /03\/04\/2018/ })).toContainText('$5.000,00');
  const grafico = page.getByRole('figure', { name: 'Gráfico del período' });
  await expect(grafico.locator('.recharts-line')).toHaveCount(2);
});

test('ventas por producto: monto por producto y cantidad por presentacion', async ({ page }) => {
  await page.goto(`/admin/reportes/productos?${DE_ABRIL}`);
  const fila = page.getByRole('row', { name: new RegExp(nombreDe(siembra.a)) });
  await expect(fila).toContainText('$4.500,00');
  await expect(fila).toContainText('3 ×');
});

test('ventas por categoria: monto y cantidad de ventas', async ({ page }) => {
  await page.goto(`/admin/reportes/categorias?${DE_ABRIL}`);
  const fila = page.getByRole('row').filter({ hasText: '$4.500,00' });
  await expect(fila.getByRole('cell').nth(1)).toHaveText('2');
});

test('un periodo sin ventas lo dice', async ({ page }) => {
  await page.goto('/admin/reportes/ventas?desde=2017-01-01&hasta=2017-01-31');
  await expect(page.getByText('No hay ventas en este período.')).toBeVisible();
});

test('el atajo del mes pasado cambia el periodo', async ({ page }) => {
  await page.goto(`/admin/reportes/ventas?${DE_ABRIL}`);
  await page.getByRole('link', { name: 'Mes pasado' }).click();
  await expect(page).toHaveURL(/desde=\d{4}-\d{2}-01/);
  await expect(page).not.toHaveURL(new RegExp(DE_ABRIL));
});

test('gastos por categoria: cada categoria y el total', async ({ page }) => {
  await page.goto(`/admin/reportes/gastos?${DE_ABRIL}`);
  const categoria = siembra.categorias[0]!.nombre;
  await expect(page.getByRole('row', { name: new RegExp(categoria) })).toContainText('$1.000,00');
  await expect(total(page, '$1.700,00')).toBeVisible();
});

test('gastos por periodo: cada dia', async ({ page }) => {
  await page.goto(`/admin/reportes/gastos-por-periodo?${DE_ABRIL}`);
  await expect(page.getByRole('row', { name: /04\/04\/2018/ })).toContainText('$700,00');
});

test('resultado: ventas menos gastos', async ({ page }) => {
  await page.goto(`/admin/reportes/resultado?${DE_ABRIL}`);
  await expect(total(page, '$5.000,00')).toBeVisible();
  await expect(total(page, '$1.700,00')).toBeVisible();
  await expect(total(page, '$3.300,00')).toBeVisible();
  await expect(page.getByText(/margen/i)).toHaveCount(0);
});

test('resultado: sin gastos cargados no lo calcula', async ({ page }) => {
  await page.goto('/admin/reportes/resultado?desde=2018-03-01&hasta=2018-03-31');
  await expect(page.getByText('Sin gastos cargados: el balance no se calcula.')).toBeVisible();
});

test('caja: cada cierre con su diferencia, el dia sin cierre y el resumen por empleado', async ({
  page,
}) => {
  await page.goto('/admin/reportes/caja?desde=2018-04-10&hasta=2018-04-12');
  await expect(page.getByRole('row', { name: /11\/04\/2018/ })).toContainText('Sin cierre');
  const cierre = page.getByRole('row', { name: /10\/04\/2018/ });
  await expect(cierre).toContainText('Prueba Caja');
  await expect(cierre).toContainText('$20.000,00');
  await expect(cierre).toContainText('Sobran');
  const resumen = page.getByRole('table', { name: 'Por empleado' });
  await expect(resumen.getByRole('row', { name: /Prueba Caja/ })).toContainText('2');
  await expect(page.getByLabel('Comparar desde')).toHaveCount(0);
});

test('guarda capturas de los reportes', async ({ page }, info) => {
  for (const ruta of ['ventas', 'productos', 'resultado', 'caja']) {
    await page.goto(`/admin/reportes/${ruta}?${DE_ABRIL}`);
    await page.evaluate(() => document.fonts.ready);
    // El grafico se dibuja recien despues de cargar la pagina: la captura espera a que este.
    const listo =
      ruta === 'caja' ? page.getByRole('table').first() : page.locator('figure svg').first();
    await expect(listo).toBeVisible();
    await page.screenshot({
      path: `e2e/capturas/reportes-${ruta}-${info.project.name}.png`,
      fullPage: true,
    });
  }
});

for (const rol of ['caja', 'invitado'] as const) {
  test.describe(`con la sesion de ${rol}`, () => {
    test.use({ storageState: SESIONES[rol] });

    test('no entra a reportes', async ({ page }) => {
      await page.goto('/admin/reportes');
      await expect(page).toHaveURL(/\/admin$/);
    });
  });
}
