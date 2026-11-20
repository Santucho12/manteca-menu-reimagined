import { expect, test } from '@playwright/test';
import { diaEnArgentina } from '../src/lib/fechas';
import { borrarHistorial, sembrarHistorial } from '../tests/historial-de-prueba';
import { SESIONES } from './ayudas';

test.use({ storageState: SESIONES.admin });

test('las tarjetas del mes muestran los montos sin centavos', async ({ page }) => {
  // La variacion necesita el mes anterior: se siembra, no se espera de la base.
  const historial = await sembrarHistorial(diaEnArgentina(new Date()));
  await page.goto('/admin');
  for (const etiqueta of ['Ventas', 'Gastos', 'Ticket promedio']) {
    const tarjeta = page.getByRole('term').filter({ hasText: etiqueta }).locator('xpath=../../..');
    await expect(tarjeta.getByRole('definition')).toHaveText(/^-?\$[\d.]+$/);
    // La coma del porcentaje sigue: lo que no va son los centavos del monto.
    await expect(tarjeta.getByText(/^[+-]\$/)).toHaveText(/^[+-]\$[\d.]+( \(.*\))?$/);
  }
  await borrarHistorial(historial);
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
  const figura = page.getByRole('figure', { name: 'Gráfico por mes' });
  // Los meses se dibujan aparte: las únicas marcas con esta clase son las del eje de montos.
  const eje = figura.locator('.recharts-cartesian-axis-tick-value');
  // allTextContents no espera: el gráfico se dibuja después de cargar la pantalla.
  await expect(eje.first()).toBeVisible();
  const marcas = await eje.allTextContents();
  expect(marcas.length).toBeGreaterThan(1);
  for (const marca of marcas) expect(marca).toMatch(/^-?\$\d+(,\d)?( [Mk])?$/);
});
