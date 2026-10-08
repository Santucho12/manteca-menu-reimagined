import { expect, test, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import {
  borrarMenuDePrueba,
  idDeCategoriaPorNombre,
  sembrarCategoria,
  sembrarProducto,
} from '../tests/menu-de-prueba';
import { SESIONES, aviso } from './ayudas';

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

async function completarProducto(page: Page, categoria: string, nombre: string) {
  await page.goto('/admin/menu/productos/nuevo');
  await page.getByLabel('Categoría').selectOption({ label: categoria });
  await page.getByLabel('Nombre', { exact: true }).fill(nombre);
  await page.getByLabel('Descripción').fill('Hecho con manteca.');
  await page.getByLabel('Etiqueta').selectOption({ label: 'Nuevo' });
}

test('crea un producto con precio y se ve en el menu publico', async ({ page }) => {
  const categoria = await sembrarCategoria({ presentaciones: ['Mediano', 'Grande'] });
  categorias.push(categoria.id);
  const nombre = nombreNuevo();
  await completarProducto(page, categoria.nombre, nombre);
  await page.getByLabel('Precio de Grande').fill('4200');
  await page.getByLabel('Se muestra en el menú').check();
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page).toHaveURL(/\/admin\/menu$/);
  await page.goto('/');
  const fila = page
    .getByRole('region', { name: categoria.nombre })
    .getByRole('listitem')
    .filter({ hasText: nombre });
  await expect(fila).toContainText('$4.200');
  await expect(fila).toContainText('Nuevo');
});

test('editar el precio cambia el menu publico', async ({ page }) => {
  const categoria = await sembrarCategoria();
  categorias.push(categoria.id);
  const producto = await sembrarProducto(categoria, { precios: [100000] });
  await page.goto(`/admin/menu/productos/${producto.id}`);
  await page.getByLabel('Precio de Unidad').fill('1300');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page).toHaveURL(/\/admin\/menu$/);
  await page.goto('/');
  await expect(page.getByRole('listitem').filter({ hasText: producto.nombre })).toContainText(
    '$1.300',
  );
});

test('un producto visible sin precio pide confirmar y queda oculto', async ({ page }) => {
  const categoria = await sembrarCategoria();
  categorias.push(categoria.id);
  const nombre = nombreNuevo();
  await completarProducto(page, categoria.nombre, nombre);
  await expect(page.getByText('Vacío queda sin precio.')).toBeVisible();
  await page.getByLabel('Se muestra en el menú').check();
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('alertdialog')).toContainText(nombre);
  // Un doble clic apurado no puede crear el producto dos veces.
  await page.getByRole('button', { name: 'Confirmar' }).dblclick();
  await expect(page.getByRole('listitem').filter({ hasText: nombre })).toContainText('Oculto');
  await expect(page.getByRole('listitem').filter({ hasText: nombre })).toHaveCount(1);
});

test('cambiar de categoria cambia los precios que se piden', async ({ page }) => {
  const facturas = await sembrarCategoria({ presentaciones: ['Docena'], compartidos: [2000000] });
  const cafe = await sembrarCategoria({ presentaciones: ['Mediano', 'Grande'] });
  categorias.push(facturas.id, cafe.id);
  await page.goto('/admin/menu/productos/nuevo');
  await page.getByLabel('Categoría').selectOption({ label: facturas.nombre });
  await expect(page.getByText(`Vacío usa el de ${facturas.nombre}: $20.000.`)).toBeVisible();
  await page.getByLabel('Categoría').selectOption({ label: cafe.nombre });
  await expect(page.getByLabel('Precio de Mediano')).toBeVisible();
  await expect(page.getByLabel('Precio de Docena')).toHaveCount(0);
});

test('un precio con puntos se explica', async ({ page }) => {
  const categoria = await sembrarCategoria();
  categorias.push(categoria.id);
  await completarProducto(page, categoria.nombre, nombreNuevo());
  await page.getByLabel('Precio de Unidad').fill('1.500');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByLabel('Precio de Unidad')).toHaveAccessibleDescription(
    /sin puntos ni centavos/,
  );
  await expect(aviso(page)).toHaveCount(0);
});
