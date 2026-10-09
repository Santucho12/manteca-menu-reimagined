import { expect, test, type Page } from '@playwright/test';
import { cambiarTolerancia, guardarCierre } from '../src/lib/caja/escritura';
import { fechaParaMostrar } from '../src/lib/gastos/pantalla';
import {
  borrarCierres,
  diaLibre,
  diaSiguiente,
  idsDeCierresDe,
  sembrarCierre,
} from '../tests/cierres-de-prueba';
import { clienteComo } from '../tests/sesiones';
import { SESIONES } from './ayudas';

test.use({ storageState: SESIONES.admin });

let fechas: string[] = [];
test.afterEach(async () => {
  await borrarCierres(await idsDeCierresDe(fechas));
  fechas = [];
});

function dia(): string {
  const fecha = diaLibre();
  fechas.push(fecha);
  return fecha;
}

/** Un cierre cargado por Caja como lo haria la pantalla, con un retiro y un gasto de caja. */
async function cierreDeCaja(fecha: string): Promise<string> {
  const resultado = await guardarCierre(await clienteComo('caja'), {
    fecha,
    fondoInicial: '10.000',
    efectivo: '25.000,50',
    credito: '',
    debito: '',
    qr: '',
    transferencia: '',
    quedaEnCaja: '8.000',
    comentario: '',
    retiros: [{ monto: '5.000', quien: 'Dueño' }],
    gastos: [{ monto: '1.200', descripcion: 'Hielo' }],
  });
  if (!resultado.ok) throw new Error(resultado.mensaje);
  return resultado.datos.id;
}

const delDia = (fecha: string) => `desde=${fecha}&hasta=${fecha}`;

function fila(page: Page, lista: string, texto: string) {
  return page.getByRole('list', { name: lista }).getByRole('listitem').filter({ hasText: texto });
}

test('ve el cierre de caja en el control y lo marca como revisado', async ({ page }) => {
  const fecha = dia();
  await cierreDeCaja(fecha);
  await page.goto(`/admin/caja/control?${delDia(fecha)}`);
  const cierre = fila(page, 'Cierres', fechaParaMostrar(fecha));
  await expect(cierre).toContainText('Prueba Caja');
  await expect(cierre).toContainText('Esperando ventas');
  await cierre.getByRole('link').click();
  await expect(page.getByText('$25.000,50')).toBeVisible();
  await page.getByRole('button', { name: 'Marcar como revisado' }).click();
  await page.getByLabel('Comentario de la revisión').fill('Lo vi con el ticket');
  await page.getByRole('button', { name: 'Confirmar revisión' }).click();
  await expect(page.getByText('Revisado', { exact: true })).toBeVisible();
  await expect(page.getByText('Lo vi con el ticket')).toBeVisible();
});

test('el gasto de caja llega a Gastos sin clasificar y solo se clasifica', async ({ page }) => {
  const fecha = dia();
  await cierreDeCaja(fecha);
  await page.goto(`/admin/gastos?${delDia(fecha)}`);
  const gasto = fila(page, 'Gastos', 'Hielo');
  await expect(gasto).toContainText('Sin clasificar');
  await expect(gasto).toContainText('De caja');
  await gasto.getByRole('link').click();
  await expect(page.getByText(/Salió de un cierre de caja/)).toBeVisible();
  await expect(page.getByLabel('Monto')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Anular' })).toHaveCount(0);
  await page.getByLabel('Categoría').selectOption({ label: 'Mantenimiento' });
  await page.getByRole('button', { name: 'Guardar' }).click();
  await page.goto(`/admin/gastos?${delDia(fecha)}`);
  await expect(fila(page, 'Gastos', 'Hielo')).toContainText('Mantenimiento');
});

test('anula el cierre con motivo y su gasto queda anulado', async ({ page }) => {
  const fecha = dia();
  const id = await cierreDeCaja(fecha);
  await page.goto(`/admin/caja/cierres/${id}`);
  await page.getByRole('button', { name: 'Anular' }).click();
  await page.getByLabel('Motivo').fill('Mal contado');
  await page.getByRole('button', { name: 'Confirmar anulación' }).click();
  await expect(page.getByText('Anulado: Mal contado')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Marcar como revisado' })).toHaveCount(0);
  await page.goto(`/admin/gastos?${delDia(fecha)}`);
  await expect(fila(page, 'Gastos', 'Hielo')).toContainText('Anulado');
});

test('marca los dias sin cierre y filtra por estado', async ({ page }) => {
  const fecha = dia();
  await sembrarCierre({ fecha });
  const tercero = diaSiguiente(fecha, 2);
  fechas.push(tercero);
  await sembrarCierre({ fecha: tercero });
  await page.goto(`/admin/caja/control?desde=${fecha}&hasta=${tercero}`);
  await expect(
    page.getByText(`Sin cierre: ${fechaParaMostrar(diaSiguiente(fecha))}`),
  ).toBeVisible();
  await page.getByLabel('Estado').selectOption({ label: 'Anulado' });
  await page.getByRole('button', { name: 'Filtrar' }).click();
  await expect(page).toHaveURL(/estado=anulado/);
  await expect(page.getByText('No hay cierres para mostrar.')).toBeVisible();
});

test('cambia la tolerancia', async ({ page }) => {
  try {
    await page.goto('/admin/caja/control');
    await page.getByLabel('Tolerancia').fill('750');
    await page.getByRole('button', { name: 'Guardar tolerancia' }).click();
    await expect(page.getByText('Tolerancia guardada.')).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Tolerancia')).toHaveValue('750');
  } finally {
    await cambiarTolerancia(await clienteComo('admin'), 50000);
  }
});

test('guarda capturas del control y de un cierre', async ({ page }, info) => {
  const fecha = dia();
  const id = await cierreDeCaja(fecha);
  await page.goto(`/admin/caja/control?${delDia(fecha)}`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `e2e/capturas/caja-control-${info.project.name}.png`,
    fullPage: true,
  });
  await page.goto(`/admin/caja/cierres/${id}`);
  await page.screenshot({
    path: `e2e/capturas/caja-cierre-${info.project.name}.png`,
    fullPage: true,
  });
});
