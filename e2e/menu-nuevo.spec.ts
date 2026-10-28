import { expect, test } from '@playwright/test';
import { SESIONES } from './ayudas';

test.use({ storageState: SESIONES.admin });

test('un solo botón Nuevo pregunta si es una categoría o un producto', async ({ page }) => {
  await page.goto('/admin/menu');
  await expect(page.getByRole('link', { name: 'Nueva categoría' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Nuevo producto' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Nuevo' }).click();
  await expect(page.getByRole('menuitem', { name: /Producto/ })).toContainText('Con sus precios');
  await page.getByRole('menuitem', { name: /Categoría/ }).click();
  await expect(page).toHaveURL(/\/admin\/menu\/categorias\/nueva$/);
});

test('desde Nuevo se llega al producto', async ({ page }) => {
  await page.goto('/admin/menu');
  await page.getByRole('button', { name: 'Nuevo' }).click();
  await page.getByRole('menuitem', { name: /Producto/ }).click();
  await expect(page).toHaveURL(/\/admin\/menu\/productos\/nuevo$/);
});
