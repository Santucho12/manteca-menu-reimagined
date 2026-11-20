import { expect, test } from '@playwright/test';

// El azul de marca del panel (pedido 101).
const AZUL = 'rgb(30, 64, 175)';

test('el ingreso: título con la palabra en azul, sin flecha y campos con ícono', async ({
  page,
}) => {
  await page.goto('/admin/ingresar');
  await expect(page.getByRole('heading', { level: 1, name: 'Ingresar al sistema' })).toBeVisible();
  await expect(page.getByText('sistema', { exact: true })).toHaveCSS('color', AZUL);
  await expect(page.getByText('Ingresá con tu usuario del local.')).toBeVisible();
  await expect(page.getByRole('link', { name: /^Volver/ })).toHaveCount(0);
  // Sin etiquetas a la vista: el nombre del campo va en el texto de ayuda y para el lector.
  await expect(page.getByLabel('Email')).toHaveAttribute('placeholder', 'email@ejemplo.com');
  const etiqueta = await page.getByText('Email', { exact: true }).boundingBox();
  expect(etiqueta!.width).toBeLessThanOrEqual(1);
  await expect(page.getByRole('button', { name: 'Mostrar contraseña' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ingresar al panel' })).toBeVisible();
});

test('el lema va pegado al logo de Manteca', async ({ page }) => {
  await page.goto('/admin/ingresar');
  const marca = page.getByRole('img', { name: 'Manteca' });
  const logo = await marca.locator('img').boundingBox();
  const lema = await marca.getByText('Sistema de gestión').boundingBox();
  expect(lema!.y - (logo!.y + logo!.height)).toBeLessThanOrEqual(8);
});

test('crear cuenta es un botón secundario que lleva al registro', async ({ page }) => {
  await page.goto('/admin/ingresar');
  await page.getByRole('link', { name: 'Crear cuenta' }).click();
  await expect(page).toHaveURL(/\/admin\/registro$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Crear cuenta' })).toBeVisible();
  await expect(page.getByText('cuenta', { exact: true })).toHaveCSS('color', AZUL);
  await page.getByRole('link', { name: 'Ya tengo cuenta' }).click();
  await expect(page).toHaveURL(/\/admin\/ingresar$/);
});
