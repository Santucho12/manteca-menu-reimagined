import { expect, test } from '@playwright/test';
import { SESIONES } from './ayudas';

test.use({ storageState: SESIONES.admin });

test('al cambiar de sección, la pantalla de carga aparece enseguida', async ({ page }) => {
  await page.goto('/admin');
  // Gastos tarda mas de un segundo en traer sus datos: la carga se ve antes que el titulo.
  await page
    .getByRole('navigation')
    .getByRole('link', { name: /^Gastos/ })
    .first()
    .click();
  await expect(page.getByRole('status', { name: 'Cargando la sección' })).toBeVisible({
    timeout: 1_000,
  });
  await expect(page.getByRole('heading', { name: 'Gastos', level: 1 })).toBeVisible();
});
