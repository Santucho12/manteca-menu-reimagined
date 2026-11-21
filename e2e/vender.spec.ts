import { expect, test, type Page } from '@playwright/test';
import { MENSAJES_DEL_MOSTRADOR } from '../src/lib/vender/escritura';
import { clienteSecretoDePruebas } from '../tests/clientes';
import {
  sembrarCategoria,
  sembrarProducto,
  type CategoriaSembrada,
  type ProductoSembrado,
} from '../tests/menu-de-prueba';
import { borrarVentas, idsDeVentasDelProducto, ventaDe } from '../tests/ventas-de-prueba';
import { irAlCobro, volverALosProductos, SESIONES, aviso, esperarHidratacion } from './ayudas';

let categoria: CategoriaSembrada;
let medialuna: ProductoSembrado;

// Docena $18.000 y Unidad $2.000, el precio de la categoría para todos sus productos.
test.beforeEach(async () => {
  categoria = await sembrarCategoria({
    presentaciones: ['Docena', 'Unidad'],
    compartidos: [1800000, 200000],
  });
  medialuna = await sembrarProducto(categoria, { precios: [null, null] });
});

test.afterEach(async () => {
  await borrarVentas(await idsDeVentasDelProducto(medialuna.id), {
    categoriasDelMenu: [categoria.id],
  });
});

async function abrirLaCategoria(page: Page) {
  await page.goto('/admin/vender');
  const categorias = page.getByRole('group', { name: 'Categorías' });
  await esperarHidratacion(categorias.getByRole('button').first());
  await categorias.getByRole('button', { name: categoria.nombre }).click();
}

const sumar = (page: Page, forma: string) =>
  page.getByRole('button', { name: `Sumar ${medialuna.nombre} · ${forma}` });
const ticket = (page: Page) => page.getByRole('list', { name: 'Ticket' });
const medio = (page: Page, grupo: string, nombre: string) =>
  page.getByRole('group', { name: grupo }).getByRole('button', { name: nombre, exact: true });

async function ventaDeLaMedialuna() {
  await expect.poll(async () => (await idsDeVentasDelProducto(medialuna.id)).length).toBe(1);
  return ventaDe((await idsDeVentasDelProducto(medialuna.id))[0]!);
}

test.describe('con la sesion de caja', () => {
  test.use({ storageState: SESIONES.caja });

  test('arma el ticket, cobra en efectivo y queda listo para otra venta', async ({ page }) => {
    await abrirLaCategoria(page);
    await sumar(page, 'Docena').click();
    await sumar(page, 'Docena').click();
    await sumar(page, 'Unidad').click();
    await expect(ticket(page).getByRole('listitem')).toHaveCount(2);
    await page.getByRole('button', { name: `Uno menos de ${medialuna.nombre} · Unidad` }).click();
    await expect(ticket(page).getByRole('listitem')).toHaveCount(1);
    await expect(ticket(page)).toContainText(`${medialuna.nombre} · Docena`);
    await irAlCobro(page);
    await medio(page, 'Medio de pago', 'Efectivo').click();
    await page.getByRole('button', { name: 'Cobrar $36.000,00' }).click();
    await expect(page.getByText('Venta guardada: $36.000,00')).toBeVisible();
    // Al cobrar en efectivo aparece la ventana de vuelto; tocándola no se va sola.
    const vuelto = page.getByRole('dialog', { name: 'Calcular vuelto' });
    await vuelto.getByLabel('¿Cuánto te pagaron?').fill('40.000');
    await expect(vuelto).toContainText('$4.000,00');
    await expect(ticket(page).getByRole('listitem')).toHaveCount(0);
    const venta = await ventaDeLaMedialuna();
    expect(venta).toMatchObject({ origen: 'mostrador', en_la_caja: true, total_centavos: 3600000 });
    expect(venta.pagos).toMatchObject([{ medio: 'efectivo', monto_centavos: 3600000 }]);
  });

  test('cobra con dos medios: una parte en efectivo y el resto con débito', async ({ page }) => {
    await abrirLaCategoria(page);
    await sumar(page, 'Docena').click();
    await irAlCobro(page);
    await medio(page, 'Medio de pago', 'Efectivo').click();
    await page.getByRole('button', { name: 'Pagar con dos medios' }).click();
    await medio(page, 'Segundo medio', 'Tarjeta de débito').click();
    await page.getByLabel('Con efectivo').fill('5.000');
    await expect(page.getByText('Con tarjeta de débito: $13.000,00')).toBeVisible();
    await page.getByRole('button', { name: 'Cobrar $18.000,00' }).click();
    await expect(page.getByText('Venta guardada: $18.000,00')).toBeVisible();
    const venta = await ventaDeLaMedialuna();
    const pagos = venta.pagos.map((p) => [p.medio, p.monto_centavos]).sort();
    expect(pagos).toEqual([
      ['debito', 1300000],
      ['efectivo', 500000],
    ]);
  });

  test('si cambió un precio con el ticket armado, no cobra y trae el precio nuevo', async ({
    page,
  }) => {
    await abrirLaCategoria(page);
    await sumar(page, 'Docena').click();
    await clienteSecretoDePruebas()
      .from('precios')
      .update({ monto_centavos: 1900000 })
      .eq('presentacion_id', categoria.presentaciones[0]!.id)
      .is('producto_id', null);
    await irAlCobro(page);
    await medio(page, 'Medio de pago', 'QR').click();
    await page.getByRole('button', { name: 'Cobrar $18.000,00' }).click();
    await expect(aviso(page)).toHaveText(MENSAJES_DEL_MOSTRADOR.precio);
    await volverALosProductos(page);
    await expect(sumar(page, 'Docena')).toContainText('$19.000');
    await expect(ticket(page).getByRole('listitem')).toHaveCount(1);
    expect(await idsDeVentasDelProducto(medialuna.id)).toEqual([]);
  });

  test('las categorías se ven enteras: ninguna queda cortada', async ({ page }) => {
    await abrirLaCategoria(page);
    const grupo = page.getByRole('group', { name: 'Categorías' });
    const caja = (await grupo.boundingBox())!;
    for (const categoria of await grupo.getByRole('button').all()) {
      const boton = (await categoria.boundingBox())!;
      expect(boton.x).toBeGreaterThanOrEqual(caja.x);
      expect(boton.x + boton.width).toBeLessThanOrEqual(caja.x + caja.width + 1);
    }
  });

  test('sin medio elegido no cobra', async ({ page }) => {
    await abrirLaCategoria(page);
    await sumar(page, 'Unidad').click();
    await irAlCobro(page);
    await expect(page.getByRole('button', { name: 'Cobrar $2.000,00' })).toBeDisabled();
  });

  test('guarda capturas del mostrador', async ({ page }, info) => {
    await abrirLaCategoria(page);
    await sumar(page, 'Docena').click();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `e2e/capturas/vender-${info.project.name}.png`, fullPage: true });
  });
});

test.describe('con la sesion del admin', () => {
  test.use({ storageState: SESIONES.admin });

  test('también vende desde Vender', async ({ page }) => {
    await abrirLaCategoria(page);
    await sumar(page, 'Unidad').click();
    await irAlCobro(page);
    await medio(page, 'Medio de pago', 'Transferencia').click();
    await page.getByRole('button', { name: 'Cobrar $2.000,00' }).click();
    await expect(page.getByText('Venta guardada: $2.000,00')).toBeVisible();
  });
});

test.describe('con la sesion del invitado', () => {
  test.use({ storageState: SESIONES.invitado });

  test('no entra a Vender', async ({ page }) => {
    await page.goto('/admin/vender');
    await expect(page).toHaveURL(/\/admin$/);
  });
});
