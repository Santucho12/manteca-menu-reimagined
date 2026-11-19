import { expect, test, type Page } from '@playwright/test';
import { diaEnArgentina } from '../src/lib/fechas';
import { borrarCierres, idsDeCierresDe } from '../tests/cierres-de-prueba';
import {
  sembrarCategoria,
  sembrarProducto,
  type CategoriaSembrada,
  type ProductoSembrado,
} from '../tests/menu-de-prueba';
import { borrarVentas, idsDeVentasDelProducto, sembrarCanal } from '../tests/ventas-de-prueba';
import { SESIONES, esperarHidratacion, terminarCierre } from './ayudas';

const HOY = diaEnArgentina(new Date());
let categoria: CategoriaSembrada;
let producto: ProductoSembrado;
let plataforma: { id: string; nombre: string };

test.beforeEach(async () => {
  categoria = await sembrarCategoria({ presentaciones: ['Unidad'], compartidos: [4000000] });
  producto = await sembrarProducto(categoria, { precios: [null] });
  plataforma = await sembrarCanal(true, `Plataforma ${Date.now()}`);
});

test.afterEach(async () => {
  await borrarCierres(await idsDeCierresDe([HOY]));
  const vendidas = await idsDeVentasDelProducto(producto.id);
  await borrarVentas(vendidas, { canales: [plataforma.id], categoriasDelMenu: [categoria.id] });
});

test.describe('con la sesión de admin', () => {
  test.use({ storageState: SESIONES.admin });

  test('en Tipos de venta no hay interruptor del cierre: todos se controlan', async ({ page }) => {
    await page.goto('/admin/ventas/canales');
    await expect(page.getByText(plataforma.nombre)).toBeVisible();
    await expect(page.getByRole('switch', { name: /se controla en el cierre/ })).toHaveCount(0);
  });
});

async function venderDelTipo(page: Page) {
  await page.goto('/admin/vender');
  const tipos = page.getByRole('group', { name: 'Tipo de venta' });
  await esperarHidratacion(tipos.getByRole('button').first());
  await tipos.getByRole('button', { name: plataforma.nombre, exact: true }).click();
  await page
    .getByRole('group', { name: 'Categorías' })
    .getByRole('button', { name: categoria.nombre })
    .click();
  await page.getByRole('button', { name: `Sumar ${producto.nombre} · Unidad` }).click();
  await page
    .getByRole('group', { name: 'Medio de pago' })
    .getByRole('button', { name: 'Fuera de la caja', exact: true })
    .click();
  await page.getByRole('button', { name: /^Cobrar/ }).click();
  await expect(page.getByText(/Venta guardada/)).toBeVisible();
}

test.describe('con la sesión de caja', () => {
  test.use({ storageState: SESIONES.caja });

  test('vende con un tipo, lo controla en el cierre y da correcto', async ({ page }) => {
    await venderDelTipo(page);
    await page.goto(`/admin/caja?fecha=${HOY}&turno=1`);
    await page.getByLabel('Fondo inicial').fill('0');
    await page.getByLabel('Efectivo contado').fill('0');
    await page.getByLabel('Queda en la caja').fill('0');
    await terminarCierre(page, { facturado: { [plataforma.nombre]: '40.000' } });
    await expect(page).toHaveURL(/\/admin\/caja\/cierres\//);
    const seccion = page.getByRole('region', { name: plataforma.nombre });
    await expect(seccion).toContainText('Facturado $40.000,00');
    await expect(seccion).toContainText('Cargado $40.000,00');
    await expect(seccion).toContainText('Da correcto');
  });
});
