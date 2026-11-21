import { expect, test } from '@playwright/test';
import { diaEnArgentina } from '../src/lib/fechas';
import { diaLibre } from '../tests/cierres-de-prueba';
import { borrarVentas, idDeCanal, sembrarVenta } from '../tests/ventas-de-prueba';
import { SESIONES, esperarHidratacion } from './ayudas';

test.use({ storageState: SESIONES.admin });

const HOY = diaEnArgentina(new Date());
let ventas: string[] = [];
test.afterEach(async () => {
  await borrarVentas(ventas);
  ventas = [];
});

async function venta(semilla: Parameters<typeof sembrarVenta>[0]) {
  const { id } = await sembrarVenta(semilla);
  ventas.push(id);
  return id;
}

test('el admin entra a Vender desde Ventas', async ({ page }) => {
  await page.goto('/admin/ventas');
  await expect(
    page.getByRole('navigation', { name: 'Panel' }).getByRole('link', { name: /^Vender/ }),
  ).toHaveCount(0);
  await page.getByRole('main').getByRole('link', { name: 'Vender', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/vender$/);
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
  await venta({ fecha: dia, origen: 'mostrador' });
  await page.goto(`/admin/ventas?desde=${dia}&hasta=${dia}`);
  await expect(page.getByText(/Fudo/)).toHaveCount(0);
  const resumen = page.getByRole('region', { name: 'Resumen de ventas' });
  await expect(resumen).toContainText('$3.000,00');
  await expect(resumen).toContainText('3 ventas');
  await page.goto(`/admin/ventas?desde=${dia}&hasta=${dia}&origen=mostrador`);
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

test('filtra por tipo de venta, con los totales del tipo', async ({ page }) => {
  const dia = diaLibre();
  await venta({ fecha: dia, origen: 'mostrador', canalId: await idDeCanal('Local') });
  await venta({ fecha: dia, canalId: await idDeCanal('Cheaf') });
  await page.goto(`/admin/ventas?desde=${dia}&hasta=${dia}`);
  await esperarHidratacion(page.getByRole('combobox', { name: 'Tipo de venta' }));
  await page.getByRole('combobox', { name: 'Tipo de venta' }).click();
  await page.getByRole('option', { name: 'Local', exact: true }).click();
  await expect(page).toHaveURL(/tipo=/);
  await expect(page.getByRole('list', { name: 'Ventas' }).getByRole('listitem')).toHaveCount(1);
  await expect(page.getByRole('region', { name: 'Resumen de ventas' })).toContainText('1 venta');
});

test('el resumen son tres tarjetas, con el ticket promedio', async ({ page }) => {
  const dia = diaLibre();
  await venta({ fecha: dia });
  await venta({ fecha: dia });
  await page.goto(`/admin/ventas?desde=${dia}&hasta=${dia}`);
  const resumen = page.getByRole('region', { name: 'Resumen de ventas' });
  for (const etiqueta of ['Cobrado', 'Ticket promedio', 'Anuladas']) {
    await expect(resumen.getByRole('term').filter({ hasText: etiqueta })).toBeVisible();
  }
  await expect(resumen.getByRole('term').filter({ hasText: 'Canceladas' })).toHaveCount(0);
  const ticket = resumen.getByRole('listitem').filter({ hasText: 'Ticket promedio' });
  await expect(ticket).toContainText('$1.000,00');
});

test('cada venta muestra su estado, su hora y su tipo de venta', async ({ page }) => {
  await venta({ fecha: HOY });
  await page.goto('/admin/ventas');
  const fila = page.getByRole('list', { name: 'Ventas' }).getByRole('listitem').first();
  await expect(fila).toContainText('Cerrada');
  // La fecha y la hora van pegadas en el texto de la fila: no hay un borde de palabra entre ellas.
  await expect(fila).toContainText(/\d{2}:\d{2}/);
  // Sin origen desde el pedido 102: la fila dice el tipo de venta.
  await expect(fila).not.toContainText('A mano');
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

test('guarda capturas de la lista', async ({ page }, info) => {
  await venta({ fecha: HOY });
  await page.goto('/admin/ventas');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `e2e/capturas/ventas-${info.project.name}.png`, fullPage: true });
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
