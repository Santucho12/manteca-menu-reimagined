import { expect, test } from '@playwright/test';
import { diaEnArgentina } from '../src/lib/fechas';
import { sumarDias } from '../src/lib/reportes/periodos';
import { borrarGastos, sembrarPorPagar } from '../tests/gastos-de-prueba';
import { SESIONES } from './ayudas';

test.use({ storageState: SESIONES.admin });

const HOY = diaEnArgentina(new Date());
let porPagar: string[] = [];
test.afterEach(async () => {
  await borrarGastos({ porPagar });
  porPagar = [];
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
