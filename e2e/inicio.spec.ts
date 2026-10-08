import { expect, test } from '@playwright/test';

test('la pagina de inicio muestra el nombre de Manteca', async ({ page }) => {
  const respuesta = await page.goto('/');

  expect(respuesta?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1, name: 'Manteca' })).toBeVisible();
  await expect(page).toHaveTitle('Manteca');
});

test('el nombre de Manteca usa Manic, la tipografia de la marca', async ({ page }) => {
  await page.goto('/');

  const nombre = page.getByRole('heading', { level: 1, name: 'Manteca' });
  await expect(nombre).toHaveCSS('font-family', /Manic/);
});

test('el documento esta en español de Argentina', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'es-AR');
});
