import { expect, test, type Page } from '@playwright/test';
import {
  borrarInsumos,
  idsDeInsumosLlamados,
  nombreDeInsumo,
  sembrarFormaDeCompra,
  sembrarInsumo,
} from '../tests/materia-prima-de-prueba';
import { SESIONES } from './ayudas';

test.use({ storageState: SESIONES.admin });

let nombres: string[] = [];
test.afterEach(async () => {
  await borrarInsumos(await idsDeInsumosLlamados(nombres));
  nombres = [];
});

function nuevoNombre(): string {
  const nombre = nombreDeInsumo();
  nombres.push(nombre);
  return nombre;
}

async function cargarInsumo(page: Page, nombre: string) {
  await page.goto('/admin/materia-prima/nuevo');
  await page.getByLabel('Nombre').fill(nombre);
  await page.getByLabel('En qué se mide').selectOption({ label: 'Gramos' });
  await page.getByRole('button', { name: 'Guardar' }).click();
}

function fila(page: Page, nombre: string) {
  return page.getByRole('listitem').filter({ hasText: nombre });
}

test('carga un insumo con su forma de compra y ve el costo por kilo en la lista', async ({
  page,
}) => {
  const nombre = nuevoNombre();
  await cargarInsumo(page, nombre);
  await expect(page.getByRole('heading', { level: 1, name: nombre })).toBeVisible();
  await expect(page.getByText('Sin precio').first()).toBeVisible();
  await page.getByRole('link', { name: 'Agregar forma de compra' }).click();
  await page.getByLabel('Cómo se compra').fill('Bolsa de 25 kg');
  await page.getByLabel('Cuánto trae, en gramos').fill('25.000');
  await page.getByLabel('Precio de referencia').fill('32.000');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('heading', { level: 1, name: nombre })).toBeVisible();
  const formas = page.getByRole('list', { name: 'Formas de compra' }).getByRole('listitem');
  await expect(formas).toHaveCount(1);
  await expect(formas).toContainText('$32.000,00');
  await page.goto(`/admin/materia-prima?q=${encodeURIComponent(nombre)}`);
  await expect(fila(page, nombre)).toContainText('$1.280,00 el kg');
  await expect(fila(page, nombre)).toContainText('Precio de referencia');
});

test('un nombre repetido avisa y deja cargarlo igual', async ({ page }) => {
  const nombre = nuevoNombre();
  await sembrarInsumo({ nombre });
  await cargarInsumo(page, nombre.toUpperCase());
  nombres.push(nombre.toUpperCase());
  await expect(
    page.getByText(`Ya hay un insumo llamado ${nombre}. ¿Lo cargás igual?`),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cargar igual' }).click();
  await expect(page.getByRole('heading', { level: 1, name: nombre.toUpperCase() })).toBeVisible();
});

test('explica un contenido que no se entiende', async ({ page }) => {
  const insumo = await sembrarInsumo({ nombre: nuevoNombre(), unidad: 'unidad' });
  await page.goto(`/admin/materia-prima/${insumo.id}/formas/nueva`);
  await page.getByLabel('Cómo se compra').fill('Maple');
  await page.getByLabel('Cuánto trae, en unidades').fill('treinta');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByLabel('Cuánto trae, en unidades')).toHaveAccessibleDescription(
    'Escribí cuánto trae, con coma para los decimales: 25.000 o 1,5.',
  );
});

test('edita, desactiva y reactiva un insumo', async ({ page }) => {
  const nombre = nuevoNombre();
  const insumo = await sembrarInsumo({ nombre });
  await page.goto(`/admin/materia-prima/${insumo.id}`);
  await page.getByRole('link', { name: 'Editar' }).click();
  await page.getByLabel('Observaciones').fill('Del molino de siempre');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Del molino de siempre')).toBeVisible();
  await page.getByRole('button', { name: 'Desactivar' }).click();
  await expect(page.getByText('Desactivado', { exact: true })).toBeVisible();
  await page.goto(`/admin/materia-prima?q=${encodeURIComponent(nombre)}`);
  await expect(fila(page, nombre)).toHaveCount(0);
  await page.getByRole('link', { name: 'Ver desactivados' }).click();
  await fila(page, nombre).getByRole('link', { name: nombre }).click();
  await page.getByRole('button', { name: 'Reactivar' }).click();
  await expect(page.getByRole('button', { name: 'Desactivar' })).toBeVisible();
});

test('cambia el precio de una forma de compra y la desactiva', async ({ page }) => {
  const insumo = await sembrarInsumo({ nombre: nuevoNombre() });
  await sembrarFormaDeCompra({ insumoId: insumo.id, localId: insumo.local_id });
  await page.goto(`/admin/materia-prima/${insumo.id}`);
  await page.getByRole('link', { name: 'Bolsa de 25 kg' }).click();
  await page.getByLabel('Precio de referencia').fill('35.000');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('$1.400,00 el kg').first()).toBeVisible();
  await page.getByRole('link', { name: 'Bolsa de 25 kg' }).click();
  await page.getByRole('button', { name: 'Desactivar' }).click();
  await page.getByRole('link', { name: `Volver a ${insumo.nombre}` }).click();
  await expect(page.getByText('Sin precio').first()).toBeVisible();
});

test('guarda capturas de la lista y la ficha', async ({ page }, info) => {
  const insumo = await sembrarInsumo({ nombre: nuevoNombre() });
  await sembrarFormaDeCompra({ insumoId: insumo.id, localId: insumo.local_id });
  await page.goto('/admin/materia-prima');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `e2e/capturas/materia-prima-${info.project.name}.png`,
    fullPage: true,
  });
  await page.goto(`/admin/materia-prima/${insumo.id}`);
  await page.screenshot({
    path: `e2e/capturas/insumo-${info.project.name}.png`,
    fullPage: true,
  });
});

for (const rol of ['caja', 'invitado'] as const) {
  test.describe(`con la sesion de ${rol}`, () => {
    test.use({ storageState: SESIONES[rol] });

    test('no entra a materia prima', async ({ page }) => {
      await page.goto('/admin/materia-prima');
      await expect(page).toHaveURL(/\/admin$/);
    });
  });
}
