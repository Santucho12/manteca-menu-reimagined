import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { borrarVentas, idsDeCanalesLlamados } from '../tests/ventas-de-prueba';
import { SESIONES, aviso } from './ayudas';

test.use({ storageState: SESIONES.admin });

let nombres: string[] = [];
test.afterEach(async () => {
  await borrarVentas([], { canales: await idsDeCanalesLlamados(nombres) });
  nombres = [];
});

function nuevoNombre(): string {
  const nombre = `Canal ${randomUUID().slice(0, 8)}`;
  nombres.push(nombre);
  return nombre;
}

function fila(page: Page, texto: string) {
  return page
    .getByRole('list', { name: 'Canales' })
    .getByRole('listitem')
    .filter({ hasText: texto });
}

async function sumar(page: Page, nombre: string) {
  await page.goto('/admin/ventas/canales');
  await page.getByLabel('Nombre del canal nuevo').fill(nombre);
  await page.getByRole('button', { name: 'Sumar' }).click();
}

test('suma un canal y aparece al cargar una venta', async ({ page }) => {
  const nombre = nuevoNombre();
  await sumar(page, nombre);
  await expect(fila(page, nombre)).toHaveCount(1);
  await page.goto('/admin/ventas/nueva');
  await expect(page.getByLabel('Canal').getByRole('option', { name: nombre })).toHaveCount(1);
});

test('no repite un nombre', async ({ page }) => {
  await sumar(page, 'cheaf');
  await expect(aviso(page)).toHaveText('Ya hay un canal con ese nombre.');
});

test('renombra, desactiva y reactiva', async ({ page }) => {
  const nombre = nuevoNombre();
  await sumar(page, nombre);
  await fila(page, nombre).getByRole('link', { name: nombre }).click();
  const otro = nuevoNombre();
  await page.getByLabel('Nombre', { exact: true }).fill(otro);
  await page.getByRole('button', { name: 'Guardar' }).click();
  await fila(page, otro).getByRole('link', { name: otro }).click();
  await page.getByRole('button', { name: 'Desactivar' }).click();
  await expect(page.getByText('Desactivado', { exact: true })).toBeVisible();
  await page.goto('/admin/ventas/nueva');
  await expect(page.getByLabel('Canal').getByRole('option', { name: otro })).toHaveCount(0);
});
