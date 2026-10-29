import { expect, test, type Page } from '@playwright/test';
import { diaEnArgentina } from '../src/lib/fechas';
import { fechaParaMostrar } from '../src/lib/gastos/pantalla';
import { sumarDias } from '../src/lib/reportes/periodos';
import { clienteSecretoDePruebas } from '../tests/clientes';
import {
  borrarCategoriasConSusGastos,
  sembrarCategoriaDeGasto,
  sembrarPorPagar,
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
  await elegirFecha(page, 'Fecha en que vence', vence);
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

async function porPagarDe(descripcion: string, vencimiento: string, montoCentavos = 800000) {
  const { id: categoriaId } = await categoria();
  return sembrarPorPagar({ categoriaId, descripcion, vencimiento, montoCentavos });
}

const fila = (page: Page, nombre: string) =>
  filas(page, 'Próximos pagos').filter({ hasText: nombre });

test('Pagado: la ventana corrige el monto y el pago pasa a Pagados', async ({ page }) => {
  const { id } = await porPagarDe('Factura de luz', sumarDias(HOY, 2));
  await page.goto('/admin/gastos');
  await fila(page, 'Factura de luz').getByRole('button', { name: 'Marcar como pago' }).click();
  const ventana = page.getByRole('dialog', { name: 'Marcar como pago: Factura de luz' });
  await expect(ventana.getByLabel('Fecha del pago')).toHaveText(fechaParaMostrar(HOY));
  await expect(ventana.getByLabel('Monto')).toHaveValue('8.000');
  await ventana.getByLabel('Monto').fill('8.350,25');
  await ventana.getByLabel('Medio de pago').selectOption({ label: 'Transferencia' });
  await ventana.getByRole('button', { name: 'Anotar el pago' }).click();
  await expect(page.getByText('Pago anotado')).toBeVisible();
  await expect(fila(page, 'Factura de luz')).toHaveCount(0);
  await expect(filas(page, 'Gastos').filter({ hasText: 'Factura de luz' })).toContainText(
    '$8.350,25',
  );
  const { data } = await clienteSecretoDePruebas()
    .from('gastos')
    .select('fecha, monto_centavos')
    .eq('por_pagar_id', id);
  expect(data).toEqual([{ fecha: HOY, monto_centavos: 835025 }]);
});

test('lo vencido queda arriba marcado Vencido', async ({ page }) => {
  await porPagarDe('Factura que vino tarde', sumarDias(HOY, 10));
  await porPagarDe('Factura vencida', sumarDias(HOY, -5));
  await page.goto('/admin/gastos');
  // Primero cuándo vence: en la columna angosta, lo que se corta es el detalle.
  await expect(fila(page, 'Factura vencida').getByText(/^Vencido · /)).toBeVisible();
  const textos = await filas(page, 'Próximos pagos').allTextContents();
  const vencida = textos.findIndex((texto) => texto.includes('Factura vencida'));
  const tarde = textos.findIndex((texto) => texto.includes('Factura que vino tarde'));
  expect(vencida).toBeGreaterThanOrEqual(0);
  expect(vencida).toBeLessThan(tarde);
});

test('No se paga: con motivo, deja de figurar', async ({ page }) => {
  const { id } = await porPagarDe('Flete que no vino', sumarDias(HOY, 4));
  await page.goto('/admin/gastos');
  await fila(page, 'Flete que no vino').getByRole('button', { name: 'No se paga' }).click();
  const ventana = page.getByRole('dialog', { name: 'No se paga: Flete que no vino' });
  await ventana.getByLabel('Motivo').fill('El flete se canceló');
  await ventana.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByText('Quitado de por pagar')).toBeVisible();
  await expect(fila(page, 'Flete que no vino')).toHaveCount(0);
  const { data } = await clienteSecretoDePruebas()
    .from('gastos_por_pagar')
    .select('anulado, motivo_anulacion')
    .eq('id', id)
    .single();
  expect(data).toEqual({ anulado: true, motivo_anulacion: 'El flete se canceló' });
});

test('un fijo se paga antes de que venza y queda el siguiente', async ({ page }) => {
  const { nombre } = await categoria();
  const vence = sumarDias(HOY, 5);
  const fijo = await sembrarRecurrente({ categoria: nombre, primerVencimiento: vence });
  await page.goto('/admin/gastos');
  await expect(fila(page, nombre)).toContainText('En 5 días');
  await fila(page, nombre).getByRole('button', { name: 'Marcar como pago' }).click();
  const ventana = page.getByRole('dialog', { name: `Marcar como pago: ${nombre}` });
  await expect(ventana.getByLabel('Monto')).toHaveValue('500.000');
  await expect(ventana.getByLabel('Medio de pago')).toHaveValue('transferencia');
  await ventana.getByRole('button', { name: 'Anotar el pago' }).click();
  await expect(page.getByText('Pago anotado')).toBeVisible();
  await expect(fila(page, nombre)).not.toContainText('En 5 días');
  const { data } = await clienteSecretoDePruebas()
    .from('gastos')
    .select('fecha, recurrente_id')
    .eq('recurrente_id', fijo.id);
  expect(data).toEqual([{ fecha: HOY, recurrente_id: fijo.id }]);
});
