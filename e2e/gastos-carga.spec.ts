import { expect, test, type Page } from '@playwright/test';
import { diaEnArgentina } from '../src/lib/fechas';
import { fechaParaMostrar } from '../src/lib/gastos/pantalla';
import { sumarMeses } from '../src/lib/gastos/vencimientos';
import { sumarDias } from '../src/lib/reportes/periodos';
import { clienteSecretoDePruebas } from '../tests/clientes';
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

async function completar(page: Page, nombre: string) {
  await page.getByLabel('Categoría').selectOption({ label: nombre });
  await page.getByLabel('Monto').fill('1.234,50');
  await page.getByLabel('Medio de pago').selectOption({ label: 'Transferencia' });
}

async function guardar(page: Page) {
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Gastos' })).toBeVisible();
}

async function cargados(categoriaId: string) {
  const secreto = clienteSecretoDePruebas();
  const [gastos, fijos] = await Promise.all([
    secreto.from('gastos').select('id, fecha, recurrente_id').eq('categoria_id', categoriaId),
    secreto
      .from('gastos_recurrentes')
      .select('id, frecuencia, primer_vencimiento')
      .eq('categoria_id', categoriaId),
  ]);
  return { gastos: gastos.data ?? [], fijos: fijos.data ?? [] };
}

async function abrirElMesSiguiente(page: Page) {
  await page.getByLabel('Fecha').click();
  await page.getByRole('button', { name: 'Mes siguiente' }).click();
}

test('carga un gasto con Ayer', async ({ page }) => {
  const { id, nombre } = await categoria();
  await page.goto('/admin/gastos/nuevo');
  await expect(page.getByLabel('Fecha')).toHaveText(fechaParaMostrar(HOY));
  await page.getByRole('button', { name: 'Ayer' }).click();
  await expect(page.getByLabel('Fecha')).toHaveText(fechaParaMostrar(sumarDias(HOY, -1)));
  await completar(page, nombre);
  await guardar(page);
  expect((await cargados(id)).gastos).toMatchObject([
    { fecha: sumarDias(HOY, -1), recurrente_id: null },
  ]);
});

test('¿Se repite? dice qué va a pasar y esconde el comprobante', async ({ page }) => {
  await page.goto('/admin/gastos/nuevo');
  await expect(page.getByLabel('Comprobante (opcional)')).toBeVisible();
  await page.getByRole('radio', { name: 'Todos los meses' }).check();
  const dia = Number(HOY.slice(8));
  await expect(
    page.getByText(`Se carga hoy y después todos los meses, el día ${dia}.`),
  ).toBeVisible();
  await expect(page.getByLabel('Comprobante (opcional)')).toHaveCount(0);
  await page.getByRole('radio', { name: 'No' }).check();
  await expect(page.getByLabel('Comprobante (opcional)')).toBeVisible();
});

test('el proveedor aparece solo con una categoría que lo pide', async ({ page }) => {
  const { nombre } = await categoria();
  await page.goto('/admin/gastos/nuevo');
  await expect(page.getByLabel('Proveedor')).toHaveCount(0);
  await page.getByLabel('Categoría').selectOption({ label: 'Mercadería' });
  await expect(page.getByLabel('Proveedor')).toBeVisible();
  await page.getByLabel('Categoría').selectOption({ label: nombre });
  await expect(page.getByLabel('Proveedor')).toHaveCount(0);
});

test('sin repetición no deja elegir un día futuro; con repetición sí', async ({ page }) => {
  const { id, nombre } = await categoria();
  const dia = `${sumarMeses(HOY, 1).slice(0, 8)}10`;
  await page.goto('/admin/gastos/nuevo');
  await abrirElMesSiguiente(page);
  await expect(page.getByRole('button', { name: fechaParaMostrar(dia) })).toBeDisabled();
  await page.keyboard.press('Escape');
  await page.getByRole('radio', { name: 'Todos los meses' }).check();
  await abrirElMesSiguiente(page);
  await page.getByRole('button', { name: fechaParaMostrar(dia) }).click();
  await expect(page.getByLabel('Fecha')).toHaveText(fechaParaMostrar(dia));
  const resumen = `Se carga el ${fechaParaMostrar(dia).slice(0, 5)} y después todos los meses`;
  await expect(page.getByText(resumen)).toBeVisible();
  await completar(page, nombre);
  await guardar(page);
  expect((await cargados(id)).fijos).toMatchObject([
    { frecuencia: 'mensual', primer_vencimiento: dia },
  ]);
});

test('un fijo de hoy se guarda y su pago ya queda cargado', async ({ page }) => {
  const { id, nombre } = await categoria();
  await page.goto('/admin/gastos/nuevo');
  await page.getByRole('radio', { name: 'Todos los meses' }).check();
  await completar(page, nombre);
  await guardar(page);
  const { gastos, fijos } = await cargados(id);
  expect(fijos).toHaveLength(1);
  expect(gastos).toMatchObject([{ fecha: HOY, recurrente_id: fijos[0]!.id }]);
});

test('el gasto que cargó un fijo dice de qué fijo vino', async ({ page }) => {
  const { id, nombre } = await categoria();
  const fijo = await sembrarRecurrente({ categoria: nombre, primerVencimiento: HOY });
  await page.goto('/admin/gastos');
  const [gasto] = (await cargados(id)).gastos;
  await page.goto(`/admin/gastos/${gasto!.id}`);
  await expect(page.getByText(/Lo cargó solo el gasto fijo/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'editá el gasto fijo' })).toHaveAttribute(
    'href',
    `/admin/gastos/fijos/${fijo.id}`,
  );
});

for (const rol of ['caja', 'invitado'] as const) {
  test.describe(`con la sesion de ${rol}`, () => {
    test.use({ storageState: SESIONES[rol] });

    test('no entra a cargar un gasto', async ({ page }) => {
      await page.goto('/admin/gastos/nuevo');
      await expect(page).toHaveURL(/\/admin$/);
    });
  });
}
