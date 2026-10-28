import { randomUUID } from 'node:crypto';
import { expect, test, type Locator, type Page } from '@playwright/test';
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

async function abrir(page: Page): Promise<Locator> {
  await page.goto('/admin/gastos');
  await page.getByRole('button', { name: 'Categorías' }).click();
  return page.getByRole('dialog', { name: 'Categorías de gastos' });
}

const fila = (ventana: Locator, texto: string) =>
  ventana
    .getByRole('list', { name: 'Categorías' })
    .getByRole('listitem')
    .filter({ hasText: texto });

async function sumar(ventana: Locator, nombre: string, pideProveedor = false) {
  await ventana.getByLabel('Nombre de la categoría nueva').fill(nombre);
  if (pideProveedor) await ventana.getByLabel('Pide proveedor').check();
  await ventana.getByRole('button', { name: 'Sumar' }).click();
}

test('suma una categoría que pide proveedor y se usa al cargar', async ({ page }) => {
  const nombre = nuevoNombre();
  const ventana = await abrir(page);
  await sumar(ventana, nombre, true);
  await expect(fila(ventana, nombre)).toContainText('Pide proveedor');
  await page.goto('/admin/gastos/nuevo');
  await page.getByLabel('Categoría').selectOption({ label: nombre });
  await expect(page.getByLabel('Proveedor')).toBeVisible();
});

test('no repite un nombre', async ({ page }) => {
  const ventana = await abrir(page);
  await sumar(ventana, 'alquiler');
  await expect(aviso(page)).toHaveText('Ya hay una categoría con ese nombre.');
});

test('renombra, desactiva y reactiva; Sin clasificar no se toca', async ({ page }) => {
  const nombre = nuevoNombre();
  const ventana = await abrir(page);
  await sumar(ventana, nombre);
  await fila(ventana, nombre)
    .getByRole('button', { name: `Editar ${nombre}` })
    .click();
  const otro = nuevoNombre();
  await ventana.getByLabel('Nombre', { exact: true }).fill(otro);
  await ventana.getByRole('button', { name: 'Guardar' }).click();
  await fila(ventana, otro).getByRole('button', { name: 'Desactivar' }).click();
  await expect(fila(ventana, otro)).toContainText('Desactivada');
  await fila(ventana, otro).getByRole('button', { name: 'Reactivar' }).click();
  await expect(fila(ventana, otro).getByRole('button', { name: 'Desactivar' })).toBeVisible();
  await expect(fila(ventana, 'Sin clasificar').getByRole('button')).toHaveCount(0);
  await expect(fila(ventana, 'Sin clasificar')).toContainText('Para los gastos de la caja');
});

test('guarda la captura de la ventana', async ({ page }, info) => {
  await abrir(page);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `e2e/capturas/gastos-categorias-${info.project.name}.png`,
    fullPage: true,
  });
});
