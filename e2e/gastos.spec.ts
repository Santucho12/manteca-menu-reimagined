import { expect, test, type Page } from '@playwright/test';
import { diaEnArgentina } from '../src/lib/fechas';
import {
  borrarCategoriasConSusGastos,
  sembrarCategoriaDeGasto,
  sembrarGasto,
} from '../tests/gastos-de-prueba';
import { SESIONES, aviso } from './ayudas';

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
    .getByRole('list', { name: 'Gastos' })
    .getByRole('listitem')
    .filter({ hasText: texto });
}

test('carga un gasto y lo ve en la lista con el total', async ({ page }) => {
  const { id, nombre } = await categoria();
  await page.goto('/admin/gastos');
  await page.getByRole('link', { name: 'Cargar gasto' }).click();
  await expect(page.getByLabel('Fecha')).toHaveValue(HOY);
  await page.getByLabel('Categoría').selectOption({ label: nombre });
  await page.getByLabel('Monto').fill('1.234,50');
  await page.getByLabel('Descripción').fill('Bolsas de residuos');
  await page.getByLabel('Medio de pago').selectOption({ label: 'Transferencia' });
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Gastos' })).toBeVisible();
  await page.getByLabel('Categoría').selectOption({ label: nombre });
  await page.getByRole('button', { name: 'Filtrar' }).click();
  await expect(page).toHaveURL(new RegExp(`categoria=${id}`));
  await expect(fila(page, 'Bolsas de residuos')).toContainText('$1.234,50');
  await expect(page.getByText('Total: $1.234,50')).toBeVisible();
});

test('un monto mal escrito y Mercaderia sin proveedor se explican', async ({ page }) => {
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
  await expect(page.getByRole('button', { name: 'Guardar' })).toHaveCount(0);
  await page.goto(`/admin/gastos?categoria=${categoriaId}`);
  await expect(page.getByText('Total: $0,00')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Gastos' })).toContainText('Anulado');
});

test('filtra por fechas', async ({ page }) => {
  const { id: categoriaId } = await categoria();
  await sembrarGasto({ categoriaId, fecha: '2026-03-10', montoCentavos: 100 });
  await sembrarGasto({ categoriaId, fecha: '2026-04-10', montoCentavos: 200 });
  await page.goto(`/admin/gastos?categoria=${categoriaId}`);
  await page.getByLabel('Desde').fill('2026-03-01');
  await page.getByLabel('Hasta').fill('2026-03-31');
  await page.getByRole('button', { name: 'Filtrar' }).click();
  await expect(page.getByRole('list', { name: 'Gastos' }).getByRole('listitem')).toHaveCount(1);
  await expect(page.getByText('Total: $1,00')).toBeVisible();
});

test('guarda capturas de la lista y el formulario', async ({ page }, info) => {
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
