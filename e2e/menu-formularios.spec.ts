import { expect, test, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import {
  borrarMenuDePrueba,
  idDeCategoriaPorNombre,
  sembrarCategoria,
  sembrarProducto,
} from '../tests/menu-de-prueba';
import { SESIONES } from './ayudas';

test.use({ storageState: SESIONES.admin });

let categorias: string[] = [];
test.afterEach(async () => {
  await borrarMenuDePrueba(categorias);
  categorias = [];
});

const nombreNuevo = () => `Prueba ${randomUUID().slice(0, 8)}`;

async function completarCategoria(page: Page, nombre: string) {
  await page.goto('/admin/menu/categorias/nueva');
  await page.getByLabel('Nombre', { exact: true }).fill(nombre);
  await page.getByLabel('Subtítulo').fill('Hecho hoy');
  await page.getByRole('radio', { name: '☕' }).check();
  await page.getByLabel('Nombre de la presentación 1').fill('Mediano');
  await page.getByRole('button', { name: 'Agregar presentación' }).click();
  await page.getByLabel('Nombre de la presentación 2').fill('Grande');
}

test('crea una categoria con foto y dos presentaciones; queda oculta', async ({ page }) => {
  const nombre = nombreNuevo();
  await completarCategoria(page, nombre);
  await page.getByLabel('Foto').setInputFiles('e2e/archivos/foto-de-prueba.jpg');
  await expect(page.getByRole('img', { name: `Foto de ${nombre}` })).toBeVisible();
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page).toHaveURL(/\/admin\/menu$/);
  categorias.push(await idDeCategoriaPorNombre(nombre));
  await expect(page.getByRole('region', { name: nombre })).toContainText('Oculta');
});

test('con precio compartido pide un monto por presentacion', async ({ page }) => {
  const nombre = nombreNuevo();
  await completarCategoria(page, nombre);
  await page.getByLabel('Precio compartido').check();
  await page.getByLabel('Precio compartido de la presentación 1').fill('1.500');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Escribí el precio en pesos, sin puntos ni centavos.')).toBeVisible();
  await page.getByLabel('Precio compartido de la presentación 1').fill('1500');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page).toHaveURL(/\/admin\/menu$/);
  categorias.push(await idDeCategoriaPorNombre(nombre));
});

test('marca el nombre que falta', async ({ page }) => {
  await page.goto('/admin/menu/categorias/nueva');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByLabel('Nombre', { exact: true })).toHaveAccessibleDescription(
    'Escribí el nombre.',
  );
});

test('sacar una presentacion avisa que productos se ocultan y, al confirmar, los oculta', async ({
  page,
}) => {
  const categoria = await sembrarCategoria({ presentaciones: ['Unidad', 'Docena'] });
  categorias.push(categoria.id);
  const producto = await sembrarProducto(categoria, { precios: [null, 900000] });
  await page.goto(`/admin/menu/categorias/${categoria.id}`);
  await page.getByRole('button', { name: 'Quitar la presentación 2' }).click();
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(
    page.getByText('Estos productos se van a ocultar porque quedan sin precio:'),
  ).toBeVisible();
  await expect(page.getByRole('listitem').filter({ hasText: producto.nombre })).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page).toHaveURL(/\/admin\/menu$/);
  await expect(page.getByRole('listitem').filter({ hasText: producto.nombre })).toContainText(
    'Oculto',
  );
});

test('una categoria que no existe da 404', async ({ page }) => {
  const respuesta = await page.goto(`/admin/menu/categorias/${randomUUID()}`);
  expect(respuesta?.status()).toBe(404);
});

test('guarda una captura del formulario de categoria', async ({ page }, info) => {
  await page.goto('/admin/menu/categorias/nueva');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `e2e/capturas/menu-categoria-${info.project.name}.png`,
    fullPage: true,
  });
});
