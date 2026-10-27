import { expect, test } from '@playwright/test';
import { SESIONES } from './ayudas';

test.use({ storageState: SESIONES.admin });

test('con la ayuda abierta, la página de atrás no se mueve', async ({ page }, info) => {
  test.skip(info.project.name !== 'computadora', 'la rueda del mouse es de la computadora');
  await page.goto('/admin');
  await page.getByRole('button', { name: 'Cómo funciona esta pantalla' }).click();
  const ventana = page.getByRole('dialog', { name: 'Cómo funciona Inicio' });
  await expect(ventana).toBeVisible();
  const cuadro = (await ventana.boundingBox())!;
  // Sobre la ventana, hasta pasarse del final de su texto.
  await page.mouse.move(cuadro.x + cuadro.width / 2, cuadro.y + cuadro.height / 2);
  for (let i = 0; i < 8; i++) await page.mouse.wheel(0, 600);
  // El texto de la ventana sí se desplaza.
  const textoDesplazado = () =>
    ventana.evaluate((el) => [...el.querySelectorAll('*')].some((e) => e.scrollTop > 0));
  await expect.poll(textoDesplazado).toBe(true);
  // Y sobre el fondo oscuro, afuera de la ventana.
  await page.mouse.move(cuadro.x + cuadro.width + 40, cuadro.y + 100);
  for (let i = 0; i < 4; i++) await page.mouse.wheel(0, 600);
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page.keyboard.press('Escape');
  await page.mouse.wheel(0, 600);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});

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
