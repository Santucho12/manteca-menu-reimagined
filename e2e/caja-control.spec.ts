import { expect, test, type Page } from '@playwright/test';
import { fechaParaMostrar } from '../src/lib/gastos/pantalla';
import {
  borrarCierres,
  diaLibre,
  diaSiguiente,
  gastosDelCierre,
  idsDeCierresDe,
  restaurarTolerancia,
  sembrarCierre,
  sembrarCierreConSalidas,
} from '../tests/cierres-de-prueba';
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

const delDia = (fecha: string) => `desde=${fecha}&hasta=${fecha}`;
// Gastos se mira por mes.
const delMes = (fecha: string) => `mes=${fecha.slice(0, 7)}`;

function fila(page: Page, lista: string, texto: string) {
  return page.getByRole('list', { name: lista }).getByRole('listitem').filter({ hasText: texto });
}

test('ve el cierre de caja en el control y lo marca como revisado', async ({ page }) => {
  const fecha = dia();
  await sembrarCierreConSalidas(fecha);
  await page.goto(`/admin/caja/control?${delDia(fecha)}`);
  const cierre = fila(page, 'Cierres', fechaParaMostrar(fecha));
  await expect(cierre).toContainText('Prueba Caja');
  await expect(cierre).toContainText('Esperando ventas');
  await cierre.getByRole('link').click();
  await expect(page.getByText('$20.000,00')).toBeVisible();
  await page.getByRole('button', { name: 'Marcar como revisado' }).click();
  await page.getByLabel('Comentario de la revisión').fill('Lo vi con el ticket');
  await page.getByRole('button', { name: 'Confirmar revisión' }).click();
  await expect(page.getByText('Revisado', { exact: true })).toBeVisible();
  await expect(page.getByText('Lo vi con el ticket')).toBeVisible();
});

test('el gasto de caja llega a Para clasificar y se clasifica ahí mismo', async ({ page }) => {
  const fecha = dia();
  await sembrarCierreConSalidas(fecha);
  await page.goto('/admin/gastos');
  const hielo = fila(page, 'Para clasificar', fechaParaMostrar(fecha)).filter({ hasText: 'Hielo' });
  await hielo.getByLabel('Categoría').selectOption({ label: 'Mercadería' });
  await expect(hielo.getByLabel('Proveedor')).toBeVisible();
  await hielo.getByLabel('Categoría').selectOption({ label: 'Mantenimiento' });
  await expect(hielo.getByLabel('Proveedor')).toHaveCount(0);
  await hielo.getByRole('button', { name: 'Listo' }).click();
  await expect(hielo).toHaveCount(0);
  await page.goto(`/admin/gastos?${delMes(fecha)}`);
  const gasto = fila(page, 'Gastos', 'Hielo').filter({ hasText: 'Mantenimiento' });
  await expect(gasto.first()).toContainText('De caja');
});

test('un gasto de caja se abre con monto y fecha fijos, y sin anular', async ({ page }) => {
  const fecha = dia();
  const cierre = await sembrarCierreConSalidas(fecha);
  const [hielo] = await gastosDelCierre(cierre);
  await page.goto(`/admin/gastos/${hielo!.id}`);
  await expect(page.getByText(/Salió de un cierre de caja/)).toBeVisible();
  await expect(page.getByLabel('Monto')).toHaveAttribute('readonly', '');
  await expect(page.getByLabel('Fecha')).toBeDisabled();
  await expect(page.getByLabel('Categoría')).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Anular' })).toHaveCount(0);
});

test('anula el cierre con motivo y su gasto queda anulado', async ({ page }) => {
  const fecha = dia();
  const id = await sembrarCierreConSalidas(fecha);
  await page.goto(`/admin/caja/cierres/${id}`);
  await page.getByRole('button', { name: 'Anular' }).click();
  await page.getByLabel('Motivo').fill('Mal contado');
  await page.getByRole('button', { name: 'Confirmar anulación' }).click();
  await expect(page.getByText('Anulado: Mal contado')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Marcar como revisado' })).toHaveCount(0);
  await page.goto(`/admin/gastos?${delMes(fecha)}&tipo=caja`);
  await expect(fila(page, 'Gastos', 'Hielo').filter({ hasText: 'Anulado' }).first()).toBeVisible();
});

test('marca los dias sin cierre y filtra por estado', async ({ page }) => {
  const fecha = dia();
  await sembrarCierre({ fecha });
  const tercero = diaSiguiente(fecha, 2);
  fechas.push(tercero);
  await sembrarCierre({ fecha: tercero });
  await page.goto(`/admin/caja/control?desde=${fecha}&hasta=${tercero}`);
  await expect(page.getByText(/días? sin cierre/)).toHaveCount(1);
  await page.getByText(/días? sin cierre/).click();
  const aviso = page.getByRole('list', { name: 'Días sin cierre' });
  await expect(
    aviso.getByRole('link', { name: fechaParaMostrar(diaSiguiente(fecha)) }),
  ).toBeVisible();
  await page.getByLabel('Estado').selectOption({ label: 'Anulado' });
  await expect(page).toHaveURL(/estado=anulado/);
  await expect(page.getByText('No hay cierres para mostrar.')).toBeVisible();
});

test('toda la fila del cierre abre su detalle', async ({ page }) => {
  const fecha = dia();
  const id = await sembrarCierreConSalidas(fecha);
  await page.goto(`/admin/caja/control?${delDia(fecha)}`);
  await fila(page, 'Cierres', fechaParaMostrar(fecha)).click({ position: { x: 300, y: 20 } });
  await expect(page).toHaveURL(new RegExp(`/admin/caja/cierres/${id}`));
});

test('cambia la tolerancia', async ({ page }) => {
  try {
    await page.goto('/admin/caja/control');
    await page.getByRole('button', { name: 'Configurar tolerancia' }).click();
    await page.getByLabel('Tolerancia', { exact: true }).fill('750');
    await page.getByRole('button', { name: 'Guardar tolerancia' }).click();
    await expect(page.getByText('Tolerancia guardada.')).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: 'Configurar tolerancia' }).click();
    await expect(page.getByLabel('Tolerancia', { exact: true })).toHaveValue('750');
  } finally {
    await restaurarTolerancia();
  }
});

test('guarda capturas del control y de un cierre', async ({ page }, info) => {
  const fecha = dia();
  const id = await sembrarCierreConSalidas(fecha);
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
