import { expect, test, type Page } from '@playwright/test';
import { diaEnArgentina } from '../src/lib/fechas';
import {
  borrarCierres,
  borrarPostergaciones,
  horasDeCierre,
  idsDeCierresDe,
  restaurarHorasDeCierre,
} from '../tests/cierres-de-prueba';
import {
  sembrarCategoria,
  sembrarProducto,
  type CategoriaSembrada,
  type ProductoSembrado,
} from '../tests/menu-de-prueba';
import {
  borrarVentas,
  idsDeVentasDelProducto,
  sembrarVentaConPago,
} from '../tests/ventas-de-prueba';
import { SESIONES, esperarHidratacion } from './ayudas';

const HOY = diaEnArgentina(new Date());
let categoria: CategoriaSembrada;
let medialuna: ProductoSembrado;
const ventas: string[] = [];

/** La hora de Argentina corrida unos minutos, como 'HH:MM'. */
function horaArgentina(minutos: number): string {
  return new Date(Date.now() + minutos * 60_000).toLocaleTimeString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
}

// Una venta del mediodía y su hora ya pasada: el mostrador queda trabado.
async function trabarElMediodia() {
  ventas.push(
    await sembrarVentaConPago({ fecha: HOY, turno: 1, medio: 'efectivo', centavos: 1000 }),
  );
  await horasDeCierre(horaArgentina(-1), '23:59');
}

test.beforeEach(async () => {
  categoria = await sembrarCategoria({ presentaciones: ['Unidad'], compartidos: [200000] });
  medialuna = await sembrarProducto(categoria, { precios: [null] });
});

test.afterEach(async () => {
  await restaurarHorasDeCierre();
  await borrarCierres(await idsDeCierresDe([HOY]));
  await borrarPostergaciones([HOY]);
  const vendidas = await idsDeVentasDelProducto(medialuna.id);
  await borrarVentas([...ventas.splice(0), ...vendidas], { categoriasDelMenu: [categoria.id] });
});

const ventana = (page: Page) => page.getByRole('alertdialog', { name: 'Cierre de caja' });

async function abrirVender(page: Page) {
  await page.goto('/admin/vender');
  await esperarHidratacion(
    page.getByRole('group', { name: 'Categorías' }).getByRole('button').first(),
  );
}

async function armarTicket(page: Page) {
  await page
    .getByRole('group', { name: 'Categorías' })
    .getByRole('button', { name: categoria.nombre })
    .click();
  await page.getByRole('button', { name: `Sumar ${medialuna.nombre} · Unidad` }).click();
}

test.describe('con la sesión de caja', () => {
  test.use({ storageState: SESIONES.caja });

  test('a la hora del cierre aparece la ventana, se posterga y se cobra', async ({ page }) => {
    await trabarElMediodia();
    await abrirVender(page);
    await expect(ventana(page)).toContainText('es hora del cierre del mediodía');
    await ventana(page).getByRole('button', { name: 'Postergar 10 min' }).click();
    await expect(ventana(page)).toBeHidden();
    await expect(page.getByText(/Cierre del mediodía postergado hasta las/)).toBeVisible();
    await armarTicket(page);
    await page
      .getByRole('group', { name: 'Medio de pago' })
      .getByRole('button', { name: 'QR', exact: true })
      .click();
    await page.getByRole('button', { name: /^Cobrar/ }).click();
    await expect(page.getByText(/Venta guardada/)).toBeVisible();
  });

  test('si la traba llega con Vender abierto, el cobro la muestra y el ticket sigue', async ({
    page,
  }) => {
    await abrirVender(page);
    await armarTicket(page);
    await trabarElMediodia();
    await page
      .getByRole('group', { name: 'Medio de pago' })
      .getByRole('button', { name: 'QR', exact: true })
      .click();
    await page.getByRole('button', { name: /^Cobrar/ }).click();
    await expect(ventana(page)).toBeVisible();
    await ventana(page).getByRole('button', { name: 'Postergar 10 min' }).click();
    await expect(page.getByRole('list', { name: 'Ticket' }).getByRole('listitem')).toHaveCount(1);
  });

  test('«Hacer el cierre» lleva a cargarlo y, cargado, se vende en la noche', async ({ page }) => {
    await trabarElMediodia();
    await abrirVender(page);
    await ventana(page).getByRole('link', { name: 'Hacer el cierre' }).click();
    await expect(page).toHaveURL(`/admin/caja?fecha=${HOY}&turno=1`);
    await expect(ventana(page)).toBeHidden();
    await expect(page.getByRole('link', { name: 'Cierre del mediodía' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await page.getByLabel('Fondo inicial').fill('10.000');
    await page.getByLabel('Efectivo contado').fill('10.010');
    await page.getByLabel('Queda en la caja').fill('10.000');
    await page.getByRole('button', { name: 'Guardar cierre' }).click();
    await expect(page).toHaveURL(/\/admin\/caja\/cierres\//);
    await abrirVender(page);
    await expect(ventana(page)).toBeHidden();
  });

  test('en Mis cierres también se ve la ventana', async ({ page }) => {
    await trabarElMediodia();
    await page.goto('/admin/caja/mis-cierres');
    await expect(ventana(page)).toBeVisible();
  });
});

test.describe('con la sesión de admin', () => {
  test.use({ storageState: SESIONES.admin });

  test('la ventana se ve en Vender y no en Gastos', async ({ page }) => {
    await trabarElMediodia();
    await abrirVender(page);
    await expect(ventana(page)).toBeVisible();
    await page.goto('/admin/gastos');
    await expect(page.getByRole('heading', { name: 'Gastos', level: 1 })).toBeVisible();
    await expect(ventana(page)).toBeHidden();
  });
});
