import { expect, test } from '@playwright/test';
import { diaEnArgentina } from '../src/lib/fechas';
import { sumarDias } from '../src/lib/reportes/periodos';
import { borrarGastos, sembrarPorPagar } from '../tests/gastos-de-prueba';
import { borrarVentas, sembrarVentaConPago } from '../tests/ventas-de-prueba';
import { SESIONES } from './ayudas';

test.use({ storageState: SESIONES.admin });

const HOY = diaEnArgentina(new Date());
let porPagar: string[] = [];
let ventas: string[] = [];
test.afterEach(async () => {
  await borrarGastos({ porPagar });
  await borrarVentas(ventas);
  porPagar = [];
  ventas = [];
});

test('el aviso de pagos cuenta lo vencido y lleva a Gastos', async ({ page }) => {
  const descripcion = 'Luz vencida de la prueba';
  porPagar.push((await sembrarPorPagar({ vencimiento: sumarDias(HOY, -1), descripcion })).id);
  await page.goto('/admin');
  await page.getByRole('link', { name: /pagos? vencidos?/ }).click();
  await expect(page).toHaveURL(/\/admin\/gastos/);
  await expect(
    page.getByRole('list', { name: 'Próximos pagos' }).getByText(descripcion),
  ).toBeVisible();
});

test('más vendidos explica que el Excel de Fudo no trae productos', async ({ page }) => {
  ventas.push(await sembrarVentaConPago({ fecha: HOY, medio: 'qr', centavos: 1000000 }));
  await page.goto('/admin');
  await expect(page.getByRole('region', { name: 'Más vendidos' })).toContainText('Excel de Fudo');
});
