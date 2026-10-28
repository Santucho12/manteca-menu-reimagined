import { expect, test, type Page } from '@playwright/test';
import { diaEnArgentina } from '../src/lib/fechas';
import { fechaParaMostrar } from '../src/lib/gastos/pantalla';
import { sumarDias } from '../src/lib/reportes/periodos';
import { clienteSecretoDePruebas } from '../tests/clientes';
import { borrarCategoriasConSusGastos, sembrarCategoriaDeGasto } from '../tests/gastos-de-prueba';
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

const filas = (page: Page, lista: string) =>
  page.getByRole('list', { name: lista }).getByRole('listitem');

async function elegirFecha(page: Page, etiqueta: string, fecha: string) {
  await page.getByLabel(etiqueta).click();
  if (fecha.slice(0, 7) !== HOY.slice(0, 7)) {
    await page.getByRole('button', { name: 'Mes siguiente' }).click();
  }
  await page.getByRole('button', { name: fechaParaMostrar(fecha) }).click();
}

async function anotados(categoriaId: string) {
  const secreto = clienteSecretoDePruebas();
  const [porPagar, gastos] = await Promise.all([
    secreto
      .from('gastos_por_pagar')
      .select('vencimiento, medio_de_pago')
      .eq('categoria_id', categoriaId),
    secreto.from('gastos').select('id').eq('categoria_id', categoriaId),
  ]);
  return { porPagar: porPagar.data ?? [], gastos: gastos.data ?? [] };
}

test('anotar algo por pagar: queda en Próximos pagos y no en Pagados', async ({ page }) => {
  const { id, nombre } = await categoria();
  const vence = sumarDias(HOY, 3);
  await page.goto('/admin/gastos/nuevo');
  await page.getByRole('radio', { name: 'Todavía no' }).check();
  await elegirFecha(page, 'Vence el', vence);
  await page.getByLabel('Categoría').selectOption({ label: nombre });
  await page.getByLabel('Monto').fill('45.000');
  await expect(page.getByLabel('Medio de pago (opcional)')).toHaveValue('');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Quedó por pagar')).toBeVisible();
  const fila = filas(page, 'Próximos pagos').filter({ hasText: nombre });
  await expect(fila).toContainText('En 3 días');
  await expect(fila).toContainText('$45.000,00');
  await expect(filas(page, 'Gastos').filter({ hasText: nombre })).toHaveCount(0);
  expect(await anotados(id)).toEqual({
    porPagar: [{ vencimiento: vence, medio_de_pago: null }],
    gastos: [],
  });
});

test('si ya lo pagaste, la fecha no puede ser futura', async ({ page }) => {
  await page.goto('/admin/gastos/nuevo');
  await expect(page.getByRole('radio', { name: 'Sí' })).toBeChecked();
  await expect(page.getByLabel('Fecha')).toBeVisible();
  await page.getByRole('radio', { name: 'Todos los meses' }).check();
  await expect(page.getByRole('radio', { name: 'Todavía no' })).toHaveCount(0);
});
