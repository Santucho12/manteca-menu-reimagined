import { expect, test, type Page } from '@playwright/test';
import { fechaParaMostrar } from '../src/lib/gastos/pantalla';
import {
  borrarCierres,
  borrarDiasSinAbrir,
  diaLibre,
  diaSiguiente,
  idsDeCierresDe,
  restaurarTolerancia,
  sembrarCierre,
  sembrarCierreConSalidas,
} from '../tests/cierres-de-prueba';
import { borrarVentas, sembrarVentaConPago } from '../tests/ventas-de-prueba';
import { SESIONES, esperarHidratacion, terminarCierre } from './ayudas';

test.use({ storageState: SESIONES.admin });

let fechas: string[] = [];
let ventas: string[] = [];
test.afterEach(async () => {
  await borrarCierres(await idsDeCierresDe(fechas));
  await borrarDiasSinAbrir(fechas);
  await borrarVentas(ventas);
  fechas = [];
  ventas = [];
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

test('ve el cierre de caja en el control con su resultado', async ({ page }) => {
  const fecha = dia();
  await sembrarCierreConSalidas(fecha);
  await page.goto(`/admin/caja/control?${delDia(fecha)}`);
  const cierre = fila(page, 'Cierres', fechaParaMostrar(fecha));
  await expect(cierre).toContainText('Prueba Caja');
  await expect(cierre).toContainText('Con diferencia');
  await cierre.getByRole('link').click();
  await expect(page.getByText('$20.000,00').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Marcar como revisado' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Editar cierre' })).toBeVisible();
});

test('anula el cierre con motivo y su gasto queda anulado', async ({ page }) => {
  const fecha = dia();
  const id = await sembrarCierreConSalidas(fecha);
  await page.goto(`/admin/caja/cierres/${id}`);
  await page.getByRole('button', { name: 'Anular' }).click();
  await page.getByLabel('Motivo').fill('Mal contado');
  await page.getByRole('button', { name: 'Confirmar anulación' }).click();
  await expect(page.getByText('Anulado: Mal contado')).toBeVisible();
  await page.goto(`/admin/gastos?${delMes(fecha)}&tipo=caja`);
  await expect(fila(page, 'Gastos', 'Hielo').filter({ hasText: 'Anulado' }).first()).toBeVisible();
});

// Un día queda pendiente si vendió en la caja y no tiene cierre (pedido 98).
async function ventaDelDia(fecha: string) {
  ventas.push(await sembrarVentaConPago({ fecha, medio: 'qr', centavos: 1000 }));
}

test('marca los dias pendientes y filtra por estado', async ({ page }) => {
  const fecha = dia();
  await sembrarCierre({ fecha });
  await ventaDelDia(diaSiguiente(fecha));
  const tercero = diaSiguiente(fecha, 2);
  fechas.push(tercero);
  await sembrarCierre({ fecha: tercero });
  await page.goto(`/admin/caja/control?desde=${fecha}&hasta=${tercero}`);
  await expect(page.getByText(/turnos? pendientes?/)).toHaveCount(1);
  await page.getByText(/turnos? pendientes?/).click();
  const aviso = page.getByRole('list', { name: 'Turnos sin cierre' });
  await expect(
    aviso.getByRole('link', { name: fechaParaMostrar(diaSiguiente(fecha)) }),
  ).toBeVisible();
  await page.getByRole('combobox', { name: 'Estado' }).click();
  await page.getByRole('option', { name: 'Pendiente', exact: true }).click();
  await expect(page).toHaveURL(/estado=pendiente/);
  await expect(
    page
      .getByRole('list', { name: 'Turnos sin cierre' })
      .getByRole('link', { name: fechaParaMostrar(diaSiguiente(fecha)) }),
  ).toBeVisible();
  await page.getByRole('combobox', { name: 'Estado' }).click();
  await page.getByRole('option', { name: 'Cierra', exact: true }).click();
  await expect(page.getByText('No hay cierres para mostrar.')).toBeVisible();
});

test('el estado ya no ofrece Esperando ventas', async ({ page }) => {
  await page.goto('/admin/caja/control');
  await page.getByRole('combobox', { name: 'Estado' }).click();
  await expect(page.getByRole('option', { name: 'Con diferencia', exact: true })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Esperando ventas' })).toHaveCount(0);
});

test('marca un dia pendiente como que no abrio y lo deshace', async ({ page }) => {
  const fecha = dia();
  const pendiente = diaSiguiente(fecha);
  const tercero = diaSiguiente(fecha, 2);
  fechas.push(pendiente, tercero);
  await sembrarCierre({ fecha });
  await sembrarCierre({ fecha: tercero });
  await ventaDelDia(pendiente);
  await page.goto(`/admin/caja/control?desde=${fecha}&hasta=${tercero}`);
  await page.getByText(/turnos? pendientes?/).click();
  await fila(page, 'Turnos sin cierre', fechaParaMostrar(pendiente))
    .getByRole('button', { name: 'No abrió' })
    .click();
  await expect(page.getByText(/turnos? pendientes?/)).toHaveCount(0);
  // El día que no abrió va en la lista de cierres, en su fecha (Santiago, 2026-11-20).
  const marcado = page.getByRole('row').filter({ hasText: fechaParaMostrar(pendiente) });
  await expect(marcado).toContainText('No abrió');
  await marcado.getByRole('button', { name: 'Deshacer' }).click();
  await expect(page.getByRole('row').filter({ hasText: 'No abrió' })).toHaveCount(0);
  await expect(page.getByText(/turnos? pendientes?/)).toHaveCount(1);
});

test('un faltante en efectivo y un sobrante igual en tarjeta no se compensan', async ({ page }) => {
  const fecha = dia();
  ventas.push(await sembrarVentaConPago({ fecha, medio: 'efectivo', centavos: 1500000 }));
  const { id } = await sembrarCierre({ fecha, creditoCentavos: 500000 });
  await page.goto(`/admin/caja/control?${delDia(fecha)}`);
  const cierre = fila(page, 'Cierres', fechaParaMostrar(fecha));
  await expect(cierre).toContainText('Efectivo: faltan $5.000,00');
  await expect(cierre).toContainText('Tarjeta de crédito: sobran $5.000,00');
  await page.goto(`/admin/caja/cierres/${id}`);
  await expect(page.getByText('No cierra en 2 medios de pago')).toBeVisible();
});

test('el admin edita un cierre y el resultado se vuelve a calcular', async ({ page }) => {
  const fecha = dia();
  // El cierre sembrado tiene fondo $10.000 y $20.000 contados: con $10.000 vendidos, cierra.
  ventas.push(await sembrarVentaConPago({ fecha, medio: 'efectivo', centavos: 1000000 }));
  const { id } = await sembrarCierre({ fecha });
  await page.goto(`/admin/caja/cierres/${id}`);
  await expect(page.getByText('La caja cierra')).toBeVisible();
  await page.getByRole('link', { name: 'Editar cierre' }).click();
  await page.getByLabel('Efectivo contado').fill('24.000');
  await terminarCierre(page);
  await expect(page.getByText('Con diferencia', { exact: true })).toBeVisible();
  await expect(page.getByText('Sobran $4.000,00').first()).toBeVisible();
});

test('toda la fila del cierre abre su detalle', async ({ page }) => {
  const fecha = dia();
  const id = await sembrarCierreConSalidas(fecha);
  await page.goto(`/admin/caja/control?${delDia(fecha)}`);
  const laFila = fila(page, 'Cierres', fechaParaMostrar(fecha));
  await esperarHidratacion(laFila.getByRole('link'));
  await laFila.click({ position: { x: 300, y: 20 } });
  await expect(page).toHaveURL(new RegExp(`/admin/caja/cierres/${id}`));
});

test('cambia la tolerancia', async ({ page }) => {
  try {
    await page.goto('/admin/caja/control');
    await page.getByRole('button', { name: 'Ajustes de caja' }).click();
    await page.getByLabel('Tolerancia', { exact: true }).fill('750');
    await page.getByRole('button', { name: 'Guardar ajustes' }).click();
    await expect(page.getByText('Ajustes guardados.')).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: 'Ajustes de caja' }).click();
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
