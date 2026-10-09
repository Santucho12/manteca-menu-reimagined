import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { borrarCategoriasConSusGastos, idsDeCategoriasLlamadas } from '../tests/gastos-de-prueba';
import { SESIONES, aviso } from './ayudas';

test.use({ storageState: SESIONES.admin });

let nombres: string[] = [];
test.afterEach(async () => {
  await borrarCategoriasConSusGastos(await idsDeCategoriasLlamadas(nombres));
  nombres = [];
});

function nuevoNombre(): string {
  const nombre = `Cat ${randomUUID().slice(0, 8)}`;
  nombres.push(nombre);
  return nombre;
}

function fila(page: Page, texto: string) {
  return page
    .getByRole('list', { name: 'Categorías' })
    .getByRole('listitem')
    .filter({ hasText: texto });
}

async function sumar(page: Page, nombre: string, pideProveedor = false) {
  await page.goto('/admin/gastos/categorias');
  await page.getByLabel('Nombre de la categoría nueva').fill(nombre);
  if (pideProveedor) await page.getByLabel('Pide proveedor').check();
  await page.getByRole('button', { name: 'Sumar' }).click();
}

test('suma una categoria que pide proveedor y aparece al cargar un gasto', async ({ page }) => {
  const nombre = nuevoNombre();
  await sumar(page, nombre, true);
  await expect(fila(page, nombre)).toContainText('Pide proveedor');
  await page.goto('/admin/gastos/nuevo');
  await expect(page.getByLabel('Categoría').getByRole('option', { name: nombre })).toHaveCount(1);
});

test('no repite un nombre', async ({ page }) => {
  await sumar(page, 'alquiler');
  await expect(aviso(page)).toHaveText('Ya hay una categoría con ese nombre.');
});

test('renombra, desactiva y reactiva; Sin clasificar no se toca', async ({ page }) => {
  const nombre = nuevoNombre();
  await sumar(page, nombre);
  await fila(page, nombre).getByRole('link', { name: nombre }).click();
  const otro = nuevoNombre();
  await page.getByLabel('Nombre', { exact: true }).fill(otro);
  await page.getByRole('button', { name: 'Guardar' }).click();
  await fila(page, otro).getByRole('link', { name: otro }).click();
  await page.getByRole('button', { name: 'Desactivar' }).click();
  await expect(page.getByText('Desactivada', { exact: true })).toBeVisible();
  await page.goto('/admin/gastos/nuevo');
  await expect(page.getByLabel('Categoría').getByRole('option', { name: otro })).toHaveCount(0);
  await page.goto('/admin/gastos/categorias');
  await expect(fila(page, 'Sin clasificar').getByRole('link')).toHaveCount(0);
});

test('guarda la captura de la lista', async ({ page }, info) => {
  await page.goto('/admin/gastos/categorias');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `e2e/capturas/gastos-categorias-${info.project.name}.png`,
    fullPage: true,
  });
});
