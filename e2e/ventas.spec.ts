import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { diaEnArgentina } from '../src/lib/fechas';
import { diaLibre } from '../tests/cierres-de-prueba';
import {
  borrarVentas,
  idsDeVentasComentadas,
  productoParaVender,
  sembrarVenta,
} from '../tests/ventas-de-prueba';
import { SESIONES } from './ayudas';

test.use({ storageState: SESIONES.admin });

const HOY = diaEnArgentina(new Date());
let ventas: string[] = [];
let comentarios: string[] = [];
let menu: string[] = [];
test.afterEach(async () => {
  const cargadas = (await Promise.all(comentarios.map(idsDeVentasComentadas))).flat();
  await borrarVentas([...ventas, ...cargadas], { categoriasDelMenu: menu });
  ventas = [];
  comentarios = [];
  menu = [];
});

async function venta(semilla: Parameters<typeof sembrarVenta>[0]) {
  const { id } = await sembrarVenta(semilla);
  ventas.push(id);
  return id;
}

test('carga una venta con dos productos y ve su total y su detalle', async ({ page }) => {
  const producto = await productoParaVender();
  menu.push(producto.categoriaId);
  const comentario = `Encargo ${randomUUID().slice(0, 8)}`;
  comentarios.push(comentario);
  await page.goto('/admin/ventas');
  await page.getByRole('link', { name: 'Cargar venta' }).click();
  await expect(page.getByLabel('Fecha')).toHaveValue(HOY);
  await page.getByLabel('Canal').selectOption({ label: 'Encargo' });
  await page.getByLabel('Medio de pago').selectOption({ label: 'Transferencia' });
  await page.getByRole('button', { name: 'Sumar producto' }).click();
  await page.getByLabel('Producto 1').selectOption({ label: producto.texto });
  await expect(page.getByLabel('Precio 1')).toHaveValue('1.000');
  await page.getByLabel('Cantidad 1').fill('2');
  await page.getByRole('button', { name: 'Sumar producto' }).click();
  await page.getByLabel('Producto 2').selectOption({ label: producto.texto });
  await page.getByLabel('Cantidad 2').fill('1,5');
  await page.getByLabel('Precio 2').fill('333,33');
  await expect(page.getByText('Total: $2.500,00')).toBeVisible();
  await page.getByLabel('Comentario').fill(comentario);
  await page.getByRole('button', { name: 'Guardar venta' }).click();
  await expect(page.getByRole('heading', { level: 1, name: /^Venta del/ })).toBeVisible();
  const renglones = page.getByRole('list', { name: 'Productos' });
  await expect(renglones.getByRole('listitem')).toHaveCount(2);
  await expect(page.getByText('Total: $2.500,00')).toBeVisible();
  await expect(page.getByText(comentario)).toBeVisible();
});

test('anula una venta a mano con motivo', async ({ page }) => {
  const id = await venta({ fecha: HOY });
  await page.goto(`/admin/ventas/${id}`);
  await page.getByRole('button', { name: 'Anular' }).click();
  await page.getByLabel('Motivo').fill('Cargada dos veces');
  await page.getByRole('button', { name: 'Confirmar anulación' }).click();
  await expect(page.getByText('Anulada: Cargada dos veces')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Anular' })).toHaveCount(0);
});

test('una venta de Fudo no se anula desde aca', async ({ page }) => {
  const id = await venta({ origen: 'fudo', fecha: HOY });
  await page.goto(`/admin/ventas/${id}`);
  await expect(page.getByText('Las ventas de Fudo se corrigen en Fudo.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Anular' })).toHaveCount(0);
});

test('filtra por fechas y origen y muestra el total', async ({ page }) => {
  const dia = diaLibre();
  await venta({ fecha: dia });
  await venta({ fecha: dia });
  await venta({ fecha: dia, origen: 'fudo' });
  await page.goto(`/admin/ventas?desde=${dia}&hasta=${dia}`);
  await expect(page.getByText('Fudo todavía no está conectado')).toBeVisible();
  await expect(page.getByText('Cobrado: $3.000,00 en 3 ventas')).toBeVisible();
  await page.getByLabel('Origen').selectOption({ label: 'Fudo' });
  await page.getByRole('button', { name: 'Filtrar' }).click();
  await expect(page).toHaveURL(/origen=fudo/);
  await expect(page.getByRole('list', { name: 'Ventas' }).getByRole('listitem')).toHaveCount(1);
  await expect(page.getByText('Cobrado: $1.000,00 en 1 venta')).toBeVisible();
});

test('guarda capturas de la lista y la carga', async ({ page }, info) => {
  await venta({ fecha: HOY });
  await page.goto('/admin/ventas');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `e2e/capturas/ventas-${info.project.name}.png`, fullPage: true });
  await page.goto('/admin/ventas/nueva');
  await page.getByRole('button', { name: 'Sumar producto' }).click();
  await page.screenshot({
    path: `e2e/capturas/venta-nueva-${info.project.name}.png`,
    fullPage: true,
  });
});

for (const rol of ['caja', 'invitado'] as const) {
  test.describe(`con la sesion de ${rol}`, () => {
    test.use({ storageState: SESIONES[rol] });

    test('no entra a ventas', async ({ page }) => {
      await page.goto('/admin/ventas');
      await expect(page).toHaveURL(/\/admin$/);
    });
  });
}
