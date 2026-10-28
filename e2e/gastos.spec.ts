import { expect, test, type Page } from '@playwright/test';
import { diaEnArgentina } from '../src/lib/fechas';
import { mesAnterior, nombreDelMes } from '../src/lib/gastos/meses';
import { sumarDias } from '../src/lib/reportes/periodos';
import {
  borrarCategoriasConSusGastos,
  sembrarCategoriaDeGasto,
  sembrarGasto,
  sembrarRecurrente,
} from '../tests/gastos-de-prueba';
import { SESIONES, aviso } from './ayudas';

test.use({ storageState: SESIONES.admin });

const HOY = diaEnArgentina(new Date());
const MES = HOY.slice(0, 7);
let categorias: string[] = [];
test.afterEach(async () => {
  await borrarCategoriasConSusGastos(categorias);
  categorias = [];
});

async function categoria() {
  const sembrada = await sembrarCategoriaDeGasto();
  categorias.push(sembrada.id);
  return sembrada;
}

const filas = (page: Page, lista: string) =>
  page.getByRole('list', { name: lista }).getByRole('listitem');

test('el mes va con flechas y no pasa al que no llegó', async ({ page }) => {
  await page.goto('/admin/gastos');
  await expect(page.getByText(nombreDelMes(MES), { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Mes siguiente' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Mes anterior' }).click();
  await expect(page).toHaveURL(new RegExp(`mes=${mesAnterior(MES)}`));
  await expect(page.getByText(nombreDelMes(mesAnterior(MES)), { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Mes siguiente' }).click();
  await expect(page).toHaveURL(/\/admin\/gastos$/);
});

test('Pagados marca los fijos y la pastilla Fijos filtra con su total', async ({ page }) => {
  const { id, nombre } = await categoria();
  await sembrarRecurrente({ categoria: nombre, primerVencimiento: HOY });
  await sembrarGasto({ categoriaId: id, fecha: HOY, montoCentavos: 123450 });
  await page.goto(`/admin/gastos?categoria=${id}`);
  await expect(filas(page, 'Gastos')).toHaveCount(2);
  await expect(filas(page, 'Gastos').filter({ hasText: 'Fijo · Todos los meses' })).toHaveCount(1);
  await expect(page.getByText('Total: $501.234,50')).toBeVisible();
  await page.getByRole('link', { name: 'Fijos', exact: true }).click();
  await expect(page).toHaveURL(/tipo=fijos/);
  await expect(filas(page, 'Gastos')).toHaveCount(1);
  await expect(page.getByText('Total: $500.000,00')).toBeVisible();
});

test('la categoría se aplica sola, sin botón ni filtro de proveedor', async ({ page }) => {
  const { id, nombre } = await categoria();
  await sembrarGasto({ categoriaId: id, fecha: HOY });
  await page.goto('/admin/gastos');
  await expect(page.getByRole('button', { name: 'Filtrar' })).toHaveCount(0);
  const pagados = page.getByRole('region', { name: 'Pagados' });
  await expect(pagados.getByLabel('Proveedor')).toHaveCount(0);
  await pagados.getByLabel('Categoría').selectOption({ label: nombre });
  await expect(page).toHaveURL(new RegExp(`categoria=${id}`));
  await expect(filas(page, 'Gastos')).toHaveCount(1);
});

test('Próximos pagos: cada fijo activo, por fecha, y los pausados aparte', async ({ page }) => {
  const [pronto, despues, pausado] = [await categoria(), await categoria(), await categoria()];
  await sembrarRecurrente({ categoria: despues.nombre, primerVencimiento: sumarDias(HOY, 10) });
  await sembrarRecurrente({ categoria: pronto.nombre, primerVencimiento: sumarDias(HOY, 3) });
  const lejos = sumarDias(HOY, 5);
  await sembrarRecurrente({ categoria: pausado.nombre, primerVencimiento: lejos, activo: false });
  await page.goto('/admin/gastos');
  const textos = await filas(page, 'Próximos pagos').allTextContents();
  const lugar = (nombre: string) => textos.findIndex((texto) => texto.includes(nombre));
  expect(lugar(pronto.nombre)).toBeGreaterThanOrEqual(0);
  expect(lugar(pronto.nombre)).toBeLessThan(lugar(despues.nombre));
  expect(lugar(pausado.nombre)).toBe(-1);
  const fila = filas(page, 'Próximos pagos').filter({ hasText: pronto.nombre });
  await expect(fila).toContainText('En 3 días');
  await expect(page.getByText(/Falta pagar este mes|Este mes no quedan pagos fijos/)).toBeVisible();
  await page.getByText(/^Pausados \(\d+\)$/).click();
  await expect(filas(page, 'Pausados').filter({ hasText: pausado.nombre })).toBeVisible();
});

test('un monto mal escrito y Mercadería sin proveedor se explican', async ({ page }) => {
  await page.goto('/admin/gastos/nuevo');
  await page.getByLabel('Categoría').selectOption({ label: 'Mercadería' });
  await page.getByLabel('Monto').fill('12,345');
  await page.getByLabel('Medio de pago').selectOption({ label: 'Otro' });
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByLabel('Monto')).toHaveAccessibleDescription(
    'Escribí el monto en pesos, con coma para los centavos: 12.345,50.',
  );
  await page.getByLabel('Monto').fill('100');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(aviso(page)).toHaveText('Esta categoría pide un proveedor. Elegilo de la lista.');
});

test('edita y anula con motivo: queda marcado y no cuenta en el total', async ({ page }) => {
  const { id: categoriaId } = await categoria();
  const gasto = await sembrarGasto({ categoriaId, fecha: HOY, montoCentavos: 50000 });
  await page.goto(`/admin/gastos/${gasto.id}`);
  await page.getByLabel('Monto').fill('600');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await page.goto(`/admin/gastos?categoria=${categoriaId}`);
  await expect(page.getByText('Total: $600,00')).toBeVisible();
  await page.goto(`/admin/gastos/${gasto.id}`);
  await page.getByRole('button', { name: 'Anular' }).click();
  await page.getByLabel('Motivo').fill('Cargado dos veces');
  await page.getByRole('button', { name: 'Confirmar anulación' }).click();
  await expect(page.getByText('Anulado: Cargado dos veces')).toBeVisible();
  await page.goto(`/admin/gastos?categoria=${categoriaId}`);
  await expect(page.getByText('Total: $0,00')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Gastos' })).toContainText('Anulado');
});

test('guarda capturas de la pantalla y del formulario', async ({ page }, info) => {
  const { id: categoriaId } = await categoria();
  await sembrarGasto({ categoriaId, fecha: HOY });
  await page.goto('/admin/gastos');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `e2e/capturas/gastos-${info.project.name}.png`, fullPage: true });
  await page.goto('/admin/gastos/nuevo');
  await page.screenshot({
    path: `e2e/capturas/gasto-nuevo-${info.project.name}.png`,
    fullPage: true,
  });
});

for (const rol of ['caja', 'invitado'] as const) {
  test.describe(`con la sesion de ${rol}`, () => {
    test.use({ storageState: SESIONES[rol] });

    test('no entra a gastos', async ({ page }) => {
      await page.goto('/admin/gastos');
      await expect(page).toHaveURL(/\/admin$/);
    });
  });
}
