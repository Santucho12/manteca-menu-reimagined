import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { diaEnArgentina } from '../src/lib/fechas';
import { diaLibre } from '../tests/cierres-de-prueba';
import {
  borrarVentas,
  idsDeVentasComentadas,
  productoParaVender,
  sembrarVenta,
} from '../tests/ventas-de-prueba';
import { SESIONES, esperarHidratacion } from './ayudas';

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

async function elegirProducto(page: Page, renglon: string, texto: string) {
  await page.getByRole('combobox', { name: renglon }).click();
  await page.getByRole('option').filter({ hasText: texto }).click();
}

test('carga una venta con dos productos y ve su total y su detalle', async ({ page }) => {
  const producto = await productoParaVender();
  menu.push(producto.categoriaId);
  const comentario = `Encargo ${randomUUID().slice(0, 8)}`;
  comentarios.push(comentario);
  await page.goto('/admin/ventas');
  await page.getByRole('link', { name: 'Cargar venta' }).click();
  await expect(page.getByLabel('Fecha')).toHaveValue(HOY);
  await esperarHidratacion(page.getByLabel('Tipo de venta', { exact: true }));
  await page.getByLabel('Tipo de venta', { exact: true }).selectOption({ label: 'Mayorista' });
  await page.getByLabel('Medio de pago').selectOption({ label: 'Transferencia' });
  await elegirProducto(page, 'Producto 1', producto.texto);
  await expect(page.getByLabel('Precio 1')).toHaveValue('1.000');
  await page.getByLabel('Cantidad 1').fill('2');
  await page.getByRole('button', { name: 'Sumar producto' }).click();
  await elegirProducto(page, 'Producto 2', producto.texto);
  await page.getByLabel('Cantidad 2').fill('1,5');
  await page.getByLabel('Precio 2').fill('333,33');
  await expect(page.getByText(/^Total: ?\$2\.500,00$/)).toBeVisible();
  await page.getByLabel('Comentario').fill(comentario);
  await page.getByRole('button', { name: 'Guardar venta' }).click();
  await expect(page.getByRole('heading', { level: 1, name: /^Venta del/ })).toBeVisible();
  const renglones = page.getByRole('list', { name: 'Productos' });
  await expect(renglones.getByRole('listitem')).toHaveCount(2);
  await expect(page.getByText(/^Total: ?\$2\.500,00$/)).toBeVisible();
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

test('una venta vieja de Fudo no se anula desde aca', async ({ page }) => {
  const id = await venta({ origen: 'fudo', fecha: HOY });
  await page.goto(`/admin/ventas/${id}`);
  await expect(page.getByText('Vino de Fudo, antes de dejarlo: no se anula.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Anular' })).toHaveCount(0);
});

test('filtra por fechas y origen y muestra el total', async ({ page }) => {
  const dia = diaLibre();
  await venta({ fecha: dia });
  await venta({ fecha: dia });
  await venta({ fecha: dia, origen: 'fudo' });
  await page.goto(`/admin/ventas?desde=${dia}&hasta=${dia}`);
  await expect(page.getByText('Fudo todavía no está conectado')).toBeVisible();
  const resumen = page.getByRole('region', { name: 'Resumen de ventas' });
  await expect(resumen).toContainText('$3.000,00');
  await expect(resumen).toContainText('3 ventas');
  await page.goto(`/admin/ventas?desde=${dia}&hasta=${dia}&origen=fudo`);
  await expect(page.getByRole('list', { name: 'Ventas' }).getByRole('listitem')).toHaveCount(1);
  await expect(resumen).toContainText('$1.000,00');
  await expect(resumen).toContainText('1 venta');
});

test('los filtros actualizan la lista solos: sin boton Filtrar ni filtro de origen', async ({
  page,
}) => {
  const dia = diaLibre();
  await venta({ fecha: dia });
  await page.goto(`/admin/ventas?desde=${dia}&hasta=${dia}`);
  await expect(page.getByRole('button', { name: 'Filtrar' })).toHaveCount(0);
  await expect(page.getByLabel('Origen')).toHaveCount(0);
  const lista = page.getByRole('list', { name: 'Ventas' });
  await expect(lista.getByRole('listitem')).toHaveCount(1);
  await page.getByRole('combobox', { name: 'Estado' }).click();
  await page.getByRole('option', { name: 'Anuladas', exact: true }).click();
  await expect(page).toHaveURL(/estado=anulada/);
  await expect(page.getByText('No hay ventas para mostrar')).toBeVisible();
});

test('el resumen son cuatro tarjetas, con el ticket promedio', async ({ page }) => {
  const dia = diaLibre();
  await venta({ fecha: dia });
  await venta({ fecha: dia });
  await page.goto(`/admin/ventas?desde=${dia}&hasta=${dia}`);
  const resumen = page.getByRole('region', { name: 'Resumen de ventas' });
  for (const etiqueta of ['Cobrado', 'Ticket promedio', 'Canceladas', 'Anuladas']) {
    await expect(resumen.getByRole('term').filter({ hasText: etiqueta })).toBeVisible();
  }
  const ticket = resumen.getByRole('listitem').filter({ hasText: 'Ticket promedio' });
  await expect(ticket).toContainText('$1.000,00');
});

test('cada venta muestra su estado, su hora y de donde viene', async ({ page }) => {
  await venta({ fecha: HOY });
  await page.goto('/admin/ventas');
  const fila = page.getByRole('list', { name: 'Ventas' }).getByRole('listitem').first();
  await expect(fila).toContainText('Cerrada');
  // La fecha y la hora van pegadas en el texto de la fila: no hay un borde de palabra entre ellas.
  await expect(fila).toContainText(/\d{2}:\d{2}/);
  await expect(fila).toContainText('A mano');
});

test('un clic en cualquier parte de la fila abre la venta', async ({ page }) => {
  const id = await venta({ fecha: HOY });
  await page.goto(`/admin/ventas?desde=${HOY}&hasta=${HOY}`);
  const fila = page
    .getByRole('list', { name: 'Ventas' })
    .getByRole('listitem')
    .filter({ has: page.locator(`a[href="/admin/ventas/${id}"]`) });
  // El total queda a la derecha de todo: ahi no hay enlace propio, y el clic igual abre la venta.
  // El enlace estirado queda encima del total: con el mouse, como una persona, no con .click().
  await fila.getByText('$1.000,00').scrollIntoViewIfNeeded();
  const total = (await fila.getByText('$1.000,00').boundingBox())!;
  await page.mouse.click(total.x + total.width / 2, total.y + total.height / 2);
  await expect(page).toHaveURL(new RegExp(`/admin/ventas/${id}$`));
});

test('una venta de Fudo sin productos avisa que no tiene detalle', async ({ page }) => {
  const id = await venta({ fecha: HOY, origen: 'fudo' });
  await page.goto(`/admin/ventas/${id}`);
  await expect(
    page.getByText('Vino de Fudo sin detalle de productos: solo el total.'),
  ).toBeVisible();
});

test('guarda capturas de la lista y la carga', async ({ page }, info) => {
  await venta({ fecha: HOY });
  await page.goto('/admin/ventas');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `e2e/capturas/ventas-${info.project.name}.png`, fullPage: true });
  await page.goto('/admin/ventas/nueva');
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
