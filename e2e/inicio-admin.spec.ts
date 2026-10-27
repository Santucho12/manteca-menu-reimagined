import { expect, test } from '@playwright/test';
import { diaEnArgentina } from '../src/lib/fechas';
import { borrarCierres, sembrarCierreConSalidas } from '../tests/cierres-de-prueba';
import { sembrarVentaConRenglones } from '../tests/reportes-de-prueba';
import { borrarVentas, productoParaVender, type ParaVender } from '../tests/ventas-de-prueba';
import { SESIONES } from './ayudas';

test.use({ storageState: SESIONES.admin });

const HOY = diaEnArgentina(new Date());
// Antes que cualquier dia que use otro test: es el gasto sin clasificar mas viejo.
const DIA_DEL_GASTO = '2000-06-15';
let cierre: string;
let producto: ParaVender;
let venta: string;

test.beforeAll(async () => {
  // El cierre deja un gasto de caja en "Sin clasificar": el aviso tiene que aparecer.
  cierre = await sembrarCierreConSalidas(DIA_DEL_GASTO);
  producto = await productoParaVender();
  // Un monto de 8 cifras: queda primero entre los mas vendidos y prueba que entra en el celular.
  venta = await sembrarVentaConRenglones({
    fecha: HOY,
    renglones: [{ producto, cantidad: 3, precioCentavos: 999_999_900 }],
  });
});

test.afterAll(async () => {
  await borrarVentas([venta], { categoriasDelMenu: [producto.categoriaId] });
  await borrarCierres([cierre]);
});

const grafico = (page: import('@playwright/test').Page) =>
  page.getByRole('figure', { name: 'Gráfico por mes' }).locator('svg').first();

const colorDeLaSerie = (page: import('@playwright/test').Page, figura: string, serie: string) =>
  page
    .getByRole('figure', { name: figura })
    .locator('.recharts-legend-item')
    .filter({ hasText: serie })
    .locator('path')
    .first();

test('los avisos van en rosa, como el ícono de Gastos', async ({ page }) => {
  await page.goto('/admin');
  const avisos = page.getByRole('region', { name: /Para atender/ });
  await expect(avisos).toHaveCSS('background-color', 'rgb(255, 241, 242)');
});

test('los gráficos van en azul, verde y rojo', async ({ page }) => {
  await page.goto('/admin');
  const esperados = [
    ['Gráfico por mes', 'Ventas', '#10b981'],
    ['Gráfico por mes', 'Resultado', '#3b82f6'],
    ['Gráfico por mes', 'Gastos', '#f43f5e'],
    ['Ventas por día', 'Esta semana', '#3b82f6'],
    ['Ventas por día', 'Semana anterior', '#f43f5e'],
  ] as const;
  for (const [figura, serie, color] of esperados) {
    await expect(colorDeLaSerie(page, figura, serie)).toHaveAttribute('fill', color);
  }
});

test('la tarjeta de Balance va en azul', async ({ page }) => {
  await page.goto('/admin');
  const tarjeta = page.getByRole('term').filter({ hasText: 'Balance' }).locator('xpath=../..');
  await expect(tarjeta.locator('svg').first()).toHaveCSS('color', 'rgb(37, 99, 235)');
});

test('los tres más vendidos llevan medalla de oro, plata y bronce', async ({ page }) => {
  await page.goto('/admin');
  const filas = page.getByRole('list', { name: 'Más vendidos' }).getByRole('listitem');
  const medallas = ['Medalla de oro', 'Medalla de plata', 'Medalla de bronce'];
  for (const [posicion, medalla] of medallas.entries()) {
    await expect(filas.nth(posicion).getByRole('img', { name: medalla })).toBeVisible();
  }
  await expect(filas.nth(3).getByRole('img', { name: /Medalla/ })).toHaveCount(0);
});

test('ve el aviso de gastos sin clasificar y lo lleva a gastos', async ({ page }) => {
  await page.goto('/admin');
  const aviso = page.getByRole('link', { name: /gastos? sin clasificar/ });
  await expect(aviso).toBeVisible();
  await aviso.click();
  await expect(page).toHaveURL(/\/admin\/gastos\?categoria=.+&desde=/);
  // El enlace lleva la fecha mas vieja: el gasto sembrado se ve aunque sea de otro mes.
  await expect(page.getByText('15/06/2000').first()).toBeVisible();
  await expect(page.getByText('Hielo').first()).toBeVisible();
});

test('un monto de 8 cifras entra en su tarjeta, sin desbordar la pantalla', async ({ page }) => {
  await page.goto('/admin');
  const valores = page.getByRole('definition');
  // El total del mes depende de lo que haya en la base: la venta sembrada se ve entre los mas vendidos.
  await expect(page.getByRole('list', { name: 'Más vendidos' })).toContainText('$29.999.997,00');
  const desbordados = await valores.evaluateAll(
    (todos) => todos.filter((v) => v.scrollWidth > v.clientWidth).length,
  );
  expect(desbordados).toBe(0);
  const sobrante = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(sobrante).toBeLessThanOrEqual(0);
});

test('ve los numeros del mes y el producto que mas vendio', async ({ page }) => {
  await page.goto('/admin');
  for (const etiqueta of ['Ventas', 'Gastos', 'Balance', 'Ticket promedio']) {
    await expect(page.getByRole('term').filter({ hasText: etiqueta })).toBeVisible();
  }
  const lista = page.getByRole('list', { name: 'Más vendidos' });
  await expect(lista.getByRole('listitem').first()).toContainText(producto.texto.split(' · ')[0]!);
  await expect(grafico(page)).toBeVisible();
});

test('el bloque de ventas del mes muestra el monto y cuantas ventas van', async ({ page }) => {
  await page.goto('/admin');
  const bloque = page.getByRole('region', { name: 'Ventas del mes' });
  await expect(bloque).toContainText(/Del 1 a hoy · \d+ ventas?/);
  await expect(bloque).toContainText(/\$[\d.]{9,},\d{2}/);
  await expect(bloque).toContainText('Gastos');
  await expect(bloque).toContainText('Balance');
});

test('el mes a mes arranca con 4 meses y se amplia a todo el año', async ({ page }) => {
  await page.goto('/admin');
  const barras = page.locator('[aria-label="Gráfico por mes"] .recharts-bar-rectangle');
  await expect(barras).toHaveCount(12); // 4 meses x 3 series
  await page.getByRole('button', { name: 'Ver todo el año' }).click();
  await expect(page.getByRole('button', { name: 'Ver 4 meses' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(await barras.count()).toBeGreaterThan(12);
});

test('abajo de todo, las ventas de los ultimos 7 dias contra los 7 anteriores', async ({
  page,
}) => {
  await page.goto('/admin');
  const panel = page.getByRole('region', { name: 'Esta semana vs la anterior' });
  await expect(panel.getByRole('figure', { name: 'Ventas por día' })).toBeVisible();
  await expect(
    panel.getByText('Esta semana vs la anterior', { exact: true }).first(),
  ).toBeVisible();
  await expect(panel.getByText('Semana anterior')).toBeVisible();
});

test('guarda capturas del inicio', async ({ page }, info) => {
  await page.goto('/admin');
  await expect(grafico(page)).toBeVisible();
  await page.screenshot({
    path: `e2e/capturas/inicio-admin-${info.project.name}.png`,
    fullPage: true,
  });
});
