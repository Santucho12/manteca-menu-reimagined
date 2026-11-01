import { expect, test, type Page } from '@playwright/test';
import { fechaParaMostrar } from '../src/lib/gastos/pantalla';
import {
  borrarCierres,
  diaLibre,
  diaSiguiente,
  idsDeCierresDe,
  sembrarCierre,
} from '../tests/cierres-de-prueba';
import { borrarVentas, sembrarVentaConPago } from '../tests/ventas-de-prueba';
import { SESIONES, aviso, esperarHidratacion, esperarNoEncontrado } from './ayudas';

test.use({ storageState: SESIONES.caja });

// Cada prueba usa dias viejos al azar: hay un cierre por dia y hoy queda para el uso real.
let fechas: string[] = [];
let ventas: string[] = [];
test.afterEach(async () => {
  await borrarCierres(await idsDeCierresDe(fechas));
  await borrarVentas(ventas);
  fechas = [];
  ventas = [];
});

function dia(): string {
  const fecha = diaLibre();
  fechas.push(fecha);
  return fecha;
}

async function completar(page: Page, fecha: string) {
  await page.goto('/admin/caja');
  await esperarHidratacion(page.getByLabel('Fecha'));
  await page.getByLabel('Fecha').fill(fecha);
  await page.getByLabel('Fondo inicial').fill('10.000');
  await page.getByLabel('Efectivo contado').fill('25.000,50');
  await page.getByLabel('Queda en la caja').fill('8.000');
}

test('carga el cierre a ciegas y despues ve su resultado completo', async ({ page }) => {
  const fecha = dia();
  await completar(page, fecha);
  await expect(page.getByText('Cargando como Prueba Caja')).toBeVisible();
  await expect(page.getByText(/esperado/i)).toHaveCount(0);
  await page.getByLabel('Tarjeta de crédito').fill('3.000');
  await page.getByRole('button', { name: 'Sumar retiro' }).click();
  await page.getByLabel('Monto del retiro 1').fill('5.000');
  await page.getByLabel('Quién retiró 1').fill('Dueño');
  await page.getByRole('button', { name: 'Sumar gasto' }).click();
  await page.getByLabel('Monto del gasto 1').fill('1.200');
  await page.getByLabel('En qué se gastó 1').fill('Hielo');
  await page.getByLabel('Comentario').fill('Todo normal');
  await page.getByRole('button', { name: 'Guardar cierre' }).click();
  await expect(page).toHaveURL(/\/admin\/caja\/cierres\//);
  await expect(page.getByText('Con diferencia', { exact: true })).toBeVisible();
  await expect(page.getByText('$25.000,50').first()).toBeVisible();
  await expect(page.getByText('Efectivo contado')).toBeVisible();
  await expect(page.getByText('¿Cómo se calcula lo esperado?')).toBeVisible();
  await expect(page.getByText('Dueño')).toBeVisible();
  await expect(page.getByText('Hielo')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Anular' })).toHaveCount(0);
});

test('el fondo inicial viene con lo que quedo en la caja el dia anterior', async ({ page }) => {
  const { fecha } = await sembrarCierre({ fecha: dia(), quedaEnCajaCentavos: 777700 });
  await page.goto(`/admin/caja?fecha=${diaSiguiente(fecha)}`);
  await expect(page.getByLabel('Fondo inicial')).toHaveValue('7.777');
});

test('avisa de que dia viene el fondo si ayer no se cargo cierre', async ({ page }) => {
  const { fecha } = await sembrarCierre({ fecha: dia(), quedaEnCajaCentavos: 777700 });
  await page.goto(`/admin/caja?fecha=${diaSiguiente(fecha)}`);
  await expect(page.getByText(/Viene del cierre del/)).toHaveCount(0);
  await page.goto(`/admin/caja?fecha=${diaSiguiente(diaSiguiente(fecha))}`);
  await expect(page.getByLabel('Fondo inicial')).toHaveValue('7.777');
  await expect(page.getByText(`Viene del cierre del ${fechaParaMostrar(fecha)}`)).toBeVisible();
});

test('no deja cargar dos cierres del mismo dia', async ({ page }) => {
  const { fecha } = await sembrarCierre({ fecha: dia() });
  await completar(page, fecha);
  await page.getByRole('button', { name: 'Guardar cierre' }).click();
  await expect(aviso(page)).toHaveText(
    'Ya hay un cierre cargado para ese día. Si está mal, abrilo y editalo.',
  );
});

test('explica lo que falta', async ({ page }) => {
  await page.goto('/admin/caja');
  await page.getByRole('button', { name: 'Guardar cierre' }).click();
  await expect(page.getByLabel('Efectivo contado')).toHaveAccessibleDescription(
    'Escribí cuánto efectivo hay en la caja.',
  );
});

test('no deja que quede en la caja mas de lo que se conto', async ({ page }) => {
  await completar(page, dia());
  await page.getByLabel('Queda en la caja').fill('250.000');
  await page.getByRole('button', { name: 'Guardar cierre' }).click();
  await expect(page.getByLabel('Queda en la caja')).toHaveAccessibleDescription(
    'No puede quedar más efectivo del que contaste.',
  );
  await expect(page).toHaveURL(/\/admin\/caja(\?|$)/);
});

test('no ve los cierres de otros ni entra al control', async ({ page }) => {
  const ajeno = await sembrarCierre({ fecha: dia(), cargadoPor: 'admin' });
  await page.goto('/admin/caja/mis-cierres');
  await expect(page.getByText(fechaParaMostrar(ajeno.fecha))).toHaveCount(0);
  await page.goto(`/admin/caja/cierres/${ajeno.id}`);
  await esperarNoEncontrado(page);
  await page.goto('/admin/caja/control');
  await expect(page).toHaveURL(/\/admin$/);
});

test('guarda la captura de la carga', async ({ page }, info) => {
  await page.goto('/admin/caja');
  await page.getByRole('button', { name: 'Sumar retiro' }).click();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `e2e/capturas/caja-${info.project.name}.png`, fullPage: true });
});

test.describe('con la sesion de invitado', () => {
  test.use({ storageState: SESIONES.invitado });

  test('no entra a caja', async ({ page }) => {
    await page.goto('/admin/caja');
    await expect(page).toHaveURL(/\/admin$/);
  });
});

test('un cierre que coincide con las ventas del dia cierra, y se puede editar', async ({
  page,
}) => {
  const fecha = dia();
  ventas.push(await sembrarVentaConPago({ fecha, medio: 'efectivo', centavos: 1500000 }));
  await completar(page, fecha);
  await page.getByLabel('Efectivo contado').fill('25.000');
  await page.getByRole('button', { name: 'Guardar cierre' }).click();
  await expect(page.getByText('Cierra', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Editar cierre' }).click();
  await page.getByLabel('Efectivo contado').fill('24.000');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByText('Con diferencia', { exact: true })).toBeVisible();
  await expect(page.getByText('Faltan $1.000,00').first()).toBeVisible();
});
