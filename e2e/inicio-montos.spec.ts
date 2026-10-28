import { expect, test } from '@playwright/test';
import { SESIONES } from './ayudas';

test.use({ storageState: SESIONES.admin });

test('las tarjetas del mes muestran los montos sin centavos', async ({ page }) => {
  await page.goto('/admin');
  for (const etiqueta of ['Ventas', 'Gastos', 'Ticket promedio']) {
    const tarjeta = page.getByRole('term').filter({ hasText: etiqueta }).locator('xpath=../../..');
    await expect(tarjeta.getByRole('definition')).toHaveText(/^-?\$[\d.]+$/);
    // La coma del porcentaje sigue: lo que no va son los centavos del monto.
    await expect(tarjeta.getByText(/^[+-]?\$/)).toHaveText(/^[+-]?\$[\d.]+( \(.*\))?$/);
  }
});

test('la ventanita del mes a mes muestra cada serie con su punto y su monto', async ({ page }) => {
  await page.goto('/admin');
  const figura = page.getByRole('figure', { name: 'Gráfico por mes' });
  await figura.locator('.recharts-bar-rectangle').first().hover();
  const ventanita = page.getByTestId('ventanita-del-mes');
  await expect(ventanita).toBeVisible();
  const filas = ventanita.getByRole('listitem');
  await expect(filas).toHaveCount(3);
  await expect(filas.first()).toContainText('Ventas');
  await expect(filas.first().getByTestId('punto-de-serie')).toHaveCSS(
    'background-color',
    'rgb(16, 185, 129)',
  );
});

test('el eje del mes a mes va en montos cortos', async ({ page }) => {
  await page.goto('/admin');
  const eje = page.getByRole('figure', { name: 'Gráfico por mes' }).locator('.recharts-yAxis');
  const marcas = await eje.locator('.recharts-cartesian-axis-tick-value').allTextContents();
  expect(marcas.length).toBeGreaterThan(1);
  for (const marca of marcas) expect(marca).toMatch(/^-?\$\d+(,\d)?( [Mk])?$/);
});
