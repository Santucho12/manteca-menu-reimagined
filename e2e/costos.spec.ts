import { expect, test, type Page } from '@playwright/test';
import { SiembraDeCostos, sembrarUnidades } from '../tests/costos-de-prueba';
import { SESIONES } from './ayudas';

test.use({ storageState: SESIONES.admin });

let siembra = new SiembraDeCostos();
test.afterEach(async () => {
  await siembra.borrar();
  siembra = new SiembraDeCostos();
});

function filaDe(page: Page, producto: string) {
  return page.getByRole('listitem').filter({ hasText: producto });
}

test('carga la receta de un producto y ve su costo, su ganancia y el sugerido', async ({
  page,
}) => {
  const { categoria, producto } = await siembra.menu();
  const insumo = await siembra.insumo(1_000);
  await sembrarUnidades(categoria, 0, 1);
  await page.goto('/admin/costos?filtro=sin_receta');
  await filaDe(page, producto.nombre).getByRole('link', { name: producto.nombre }).click();
  await page.getByRole('button', { name: 'Agregar insumo' }).click();
  await page.getByLabel('Insumo 1').selectOption({ label: insumo.nombre });
  await page.getByLabel('Cantidad 1').fill('35');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Guardamos la receta.')).toBeVisible();
  await page.goto('/admin/costos');
  const fila = filaDe(page, producto.nombre);
  await expect(fila).toContainText('$350,00');
  await expect(fila).toContainText('$650,00');
  await expect(fila).toContainText('65 %');
  await expect(fila).toContainText('Faltan las unidades');
});

test('debajo del minimo se marca y se filtra', async ({ page }) => {
  const { categoria, producto } = await siembra.menu([50_000, null]);
  const insumo = await siembra.insumo(1_000);
  await sembrarUnidades(categoria, 0, 1);
  await page.goto(`/admin/costos`);
  await filaDe(page, producto.nombre).getByRole('link', { name: producto.nombre }).click();
  await page.getByRole('button', { name: 'Agregar insumo' }).click();
  await page.getByLabel('Insumo 1').selectOption({ label: insumo.nombre });
  await page.getByLabel('Cantidad 1').fill('35');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Guardamos la receta.')).toBeVisible();
  await page.goto('/admin/costos?filtro=debajo');
  await expect(filaDe(page, producto.nombre)).toContainText('Debajo del mínimo');
});

test('en Ajustes cambia los margenes y las unidades de una presentacion', async ({ page }) => {
  const { categoria } = await siembra.menu();
  await page.goto('/admin/costos/ajustes');
  await page.getByLabel('Margen objetivo').fill('70');
  await page.getByLabel('Margen mínimo').fill('55');
  await page.getByRole('button', { name: 'Guardar márgenes' }).click();
  await expect(page.getByText('Guardamos los márgenes.')).toBeVisible();
  const docena = page.getByRole('group', { name: `${categoria.nombre} · Docena` });
  await docena.getByLabel('Unidades').fill('12');
  await docena.getByRole('button', { name: 'Guardar' }).click();
  await expect(docena.getByText('Guardado.')).toBeVisible();
  await page.getByLabel('Margen objetivo').fill('65');
  await page.getByLabel('Margen mínimo').fill('50');
  await page.getByRole('button', { name: 'Guardar márgenes' }).click();
});

test('guarda capturas de la lista y de una receta', async ({ page }, info) => {
  const { producto } = await siembra.menu();
  await page.goto('/admin/costos');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `e2e/capturas/costos-${info.project.name}.png`, fullPage: true });
  await page.goto(`/admin/costos/productos/${producto.id}`);
  await page.screenshot({ path: `e2e/capturas/receta-${info.project.name}.png`, fullPage: true });
});

for (const rol of ['caja', 'invitado'] as const) {
  test.describe(`con la sesion de ${rol}`, () => {
    test.use({ storageState: SESIONES[rol] });

    test('no entra a costos', async ({ page }) => {
      await page.goto('/admin/costos');
      await expect(page).toHaveURL(/\/admin$/);
    });
  });
}
