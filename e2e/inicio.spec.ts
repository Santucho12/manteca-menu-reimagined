import { expect, test } from '@playwright/test';

// El contenido de la pagina de inicio lo prueba menu-publico.spec.ts.
test('el documento esta en español de Argentina', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'es-AR');
});
