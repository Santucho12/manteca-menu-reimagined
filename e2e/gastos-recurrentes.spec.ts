import { expect, test, type Page } from '@playwright/test';
import { diaEnArgentina } from '../src/lib/fechas';
import { fechaParaMostrar } from '../src/lib/gastos/pantalla';
import { sumarMeses } from '../src/lib/gastos/vencimientos';
import {
  borrarCategoriasConSusGastos,
  sembrarCategoriaDeGasto,
  sembrarRecurrente,
} from '../tests/gastos-de-prueba';
import { SESIONES } from './ayudas';

test.use({ storageState: SESIONES.admin });

const HOY = diaEnArgentina(new Date());
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

function fila(page: Page, texto: string) {
  return page
    .getByRole('list', { name: 'Recurrentes' })
    .getByRole('listitem')
    .filter({ hasText: texto });
}

test('carga un recurrente y muestra su proximo vencimiento', async ({ page }) => {
  const { nombre } = await categoria();
  const vence = sumarMeses(HOY, 1);
  await page.goto('/admin/gastos');
  await page.getByRole('link', { name: 'Recurrentes' }).click();
  await page.getByRole('link', { name: 'Nuevo recurrente' }).click();
  await page.getByLabel('Categoría').selectOption({ label: nombre });
  await page.getByLabel('Monto').fill('500.000');
  await page.getByLabel('Descripción').fill('Alquiler del local');
  await page.getByLabel('Medio de pago').selectOption({ label: 'Transferencia' });
  await page.getByLabel('Cada cuánto').selectOption({ label: 'Todos los meses' });
  await page.getByLabel('Primer vencimiento').fill(vence);
  await page.getByRole('button', { name: 'Guardar' }).click();
  const recurrente = fila(page, 'Alquiler del local');
  await expect(recurrente).toContainText('$500.000,00');
  await expect(recurrente).toContainText('Todos los meses');
  await expect(recurrente).toContainText(`Próximo: ${fechaParaMostrar(vence)}`);
});

test('lo vencido aparece en Gastos al abrir', async ({ page }) => {
  const { id, nombre } = await categoria();
  await sembrarRecurrente({ categoria: nombre, primerVencimiento: HOY });
  await page.goto(`/admin/gastos?categoria=${id}`);
  await expect(page.getByRole('list', { name: 'Gastos' }).getByRole('listitem')).toHaveCount(1);
  await expect(page.getByText('Total: $500.000,00')).toBeVisible();
});

test('edita, desactiva y reactiva', async ({ page }) => {
  const { nombre } = await categoria();
  await sembrarRecurrente({ categoria: nombre, primerVencimiento: sumarMeses(HOY, 3) });
  await page.goto('/admin/gastos/recurrentes');
  await fila(page, nombre).getByRole('link').click();
  await page.getByLabel('Monto').fill('1.000');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(fila(page, nombre)).toContainText('$1.000,00');
  await fila(page, nombre).getByRole('link').click();
  await page.getByRole('button', { name: 'Desactivar' }).click();
  await expect(page.getByText('Desactivado', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reactivar' }).click();
  await expect(page.getByRole('button', { name: 'Desactivar' })).toBeVisible();
});

test('guarda la captura de la lista', async ({ page }, info) => {
  const { nombre } = await categoria();
  await sembrarRecurrente({ categoria: nombre, primerVencimiento: sumarMeses(HOY, 1) });
  await page.goto('/admin/gastos/recurrentes');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `e2e/capturas/gastos-recurrentes-${info.project.name}.png`,
    fullPage: true,
  });
});

test.describe('con la sesion de caja', () => {
  test.use({ storageState: SESIONES.caja });

  test('no entra a recurrentes ni a categorias', async ({ page }) => {
    await page.goto('/admin/gastos/recurrentes');
    await expect(page).toHaveURL(/\/admin$/);
    await page.goto('/admin/gastos/categorias');
    await expect(page).toHaveURL(/\/admin$/);
  });
});
