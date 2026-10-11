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
  'Resultado',
];
const nombreDe = (producto: { texto: string }) => producto.texto.split(' · ')[0]!;
const total = (page: Page, texto: string) =>
  page.getByRole('definition').filter({ hasText: texto }).first();

test('la lista lleva a cada reporte', async ({ page }) => {
  await page.goto('/admin');
  await page.getByRole('link', { name: 'Reportes' }).first().click();
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
  await page.getByRole('button', { name: 'Ver' }).click();
  await expect(page).toHaveURL(new RegExp(DE_ABRIL));
  await expect(total(page, '$5.000,00')).toBeVisible();
  await expect(page.getByText('+$2.500,00 (+100 %)')).toBeVisible();
  await expect(total(page, '$2.500,00')).toBeVisible();
  await expect(page.getByRole('row', { name: /03\/04\/2018/ })).toContainText('$5.000,00');
  await expect(page.getByRole('figure', { name: 'Gráfico del período' })).toBeVisible();
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

for (const rol of ['caja', 'invitado'] as const) {
  test.describe(`con la sesion de ${rol}`, () => {
    test.use({ storageState: SESIONES[rol] });

    test('no entra a reportes', async ({ page }) => {
      await page.goto('/admin/reportes');
      await expect(page).toHaveURL(/\/admin$/);
    });
  });
}
