import { expect, test } from '@playwright/test';
import { SESIONES } from './ayudas';

test.use({ storageState: SESIONES.admin });

test('la ayuda de la pantalla se abre y se cierra', async ({ page }) => {
  await page.goto('/admin');
  const boton = page.getByRole('button', { name: 'Cómo funciona esta pantalla' });
  await boton.click();
  const ventana = page.getByRole('dialog', { name: 'Cómo funciona Inicio' });
  await expect(ventana).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(ventana).toHaveCount(0);
  await boton.click();
  await ventana.getByRole('button', { name: 'Entendido' }).click();
  await expect(ventana).toHaveCount(0);
});
