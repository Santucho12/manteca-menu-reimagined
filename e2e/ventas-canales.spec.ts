import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import {
  borrarVentas,
  idsDeCanalesLlamados,
  sembrarCanal,
  sembrarVenta,
} from '../tests/ventas-de-prueba';
import { SESIONES, aviso } from './ayudas';

test.use({ storageState: SESIONES.admin });

let nombres: string[] = [];
let ventas: string[] = [];
test.afterEach(async () => {
  await borrarVentas(ventas, { canales: await idsDeCanalesLlamados(nombres) });
  nombres = [];
  ventas = [];
});

function nuevoNombre(): string {
  const nombre = `Canal ${randomUUID().slice(0, 8)}`;
  nombres.push(nombre);
  return nombre;
}

function fila(page: Page, texto: string) {
  return page
    .getByRole('list', { name: 'Tipos de venta' })
    .getByRole('listitem')
    .filter({ hasText: texto });
}

async function sumar(page: Page, nombre: string) {
  await page.goto('/admin/ventas/canales');
  await page.getByLabel('Nombre del tipo de venta nuevo').fill(nombre);
  await page.getByRole('button', { name: 'Sumar' }).click();
}

test('suma un canal y aparece en Vender', async ({ page }) => {
  const nombre = nuevoNombre();
  await sumar(page, nombre);
  await expect(fila(page, nombre)).toHaveCount(1);
  // Desde el pedido 102 no hay carga a mano: el tipo de venta se elige en Vender.
  await page.goto('/admin/vender');
  await expect(
    page.getByRole('group', { name: 'Tipo de venta' }).getByRole('button', { name: nombre }),
  ).toHaveCount(1);
});

test('no repite un nombre', async ({ page }) => {
  await sumar(page, 'cheaf');
  await expect(aviso(page)).toHaveText('Ya hay un tipo de venta con ese nombre.');
});

test('cada canal tiene editar, un interruptor para activarlo y borrar, a la vista', async ({
  page,
}) => {
  const nombre = nuevoNombre();
  await sumar(page, nombre);
  const canal = fila(page, nombre);
  await expect(canal.getByRole('link', { name: `Editar ${nombre}` })).toBeVisible();
  const interruptor = canal.getByRole('switch', { name: `Tipo de venta ${nombre} activo` });
  await expect(interruptor).toHaveAttribute('aria-checked', 'true');
  await interruptor.click();
  await expect(interruptor).toHaveAttribute('aria-checked', 'false');
  await expect(canal).toContainText('Desactivado');
  // Desde el pedido 102 no hay carga a mano: el tipo de venta se elige en Vender.
  await page.goto('/admin/vender');
  await expect(
    page.getByRole('group', { name: 'Tipo de venta' }).getByRole('button', { name: nombre }),
  ).toHaveCount(0);
  await page.goto('/admin/ventas/canales');
  await fila(page, nombre).getByRole('switch').click();
  await expect(fila(page, nombre)).not.toContainText('Desactivado');
});

test('borra un canal sin ventas, y uno con ventas pide desactivarlo', async ({ page }) => {
  const nombre = nuevoNombre();
  await sumar(page, nombre);
  await fila(page, nombre)
    .getByRole('button', { name: `Borrar ${nombre}` })
    .click();
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(fila(page, nombre)).toHaveCount(0);
  // Un tipo propio con una venta: no depende de que la base tenga ventas de Cheaf ni lo borra.
  const conVentas = await sembrarCanal(true, nuevoNombre());
  ventas.push((await sembrarVenta({ canalId: conVentas.id })).id);
  await page.goto('/admin/ventas/canales');
  await fila(page, conVentas.nombre)
    .getByRole('button', { name: `Borrar ${conVentas.nombre}` })
    .click();
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByRole('alertdialog')).toContainText('ya tiene ventas');
});

test('renombra, desactiva y reactiva', async ({ page }) => {
  const nombre = nuevoNombre();
  await sumar(page, nombre);
  await fila(page, nombre).getByRole('link', { name: nombre, exact: true }).click();
  const otro = nuevoNombre();
  await page.getByLabel('Nombre', { exact: true }).fill(otro);
  await page.getByRole('button', { name: 'Guardar' }).click();
  await fila(page, otro).getByRole('link', { name: otro, exact: true }).click();
  await page.getByRole('button', { name: 'Desactivar' }).click();
  await expect(page.getByText('Desactivado', { exact: true })).toBeVisible();
  await page.goto('/admin/ventas/nueva');
  await expect(
    page.getByLabel('Tipo de venta', { exact: true }).getByRole('option', { name: otro }),
  ).toHaveCount(0);
});
