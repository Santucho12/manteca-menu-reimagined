import { expect, test } from '@playwright/test';
import { resetearComoAdmin } from '../tests/consultas-de-prueba';
import { emailDePrueba } from '../tests/cuentas';
import {
  borrarCuentaTemporal,
  crearCuentaTemporal,
  type CuentaTemporal,
} from '../tests/cuentas-temporales';
import { SESIONES, aviso, ingresarComo } from './ayudas';

test.describe('con la sesion de caja', () => {
  test.use({ storageState: SESIONES.caja });

  test('Mi cuenta muestra el nombre, el email y el rol, sin poder editarlos', async ({ page }) => {
    await page.goto('/admin/cuenta');
    const pantalla = page.getByRole('main');
    await expect(pantalla.getByText('Prueba Caja', { exact: true })).toBeVisible();
    await expect(pantalla.getByText(emailDePrueba('caja'), { exact: true })).toBeVisible();
    await expect(pantalla.getByText('Caja', { exact: true })).toBeVisible();
    await expect(pantalla.getByRole('textbox', { name: 'Nombre' })).toHaveCount(0);
  });

  test('guarda una captura de Mi cuenta', async ({ page }, info) => {
    await page.goto('/admin/cuenta');
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `e2e/capturas/cuenta-${info.project.name}.png`, fullPage: true });
  });
});

test.describe('con la sesion de un invitado', () => {
  test.use({ storageState: SESIONES.invitado });

  test('no entra a Mi cuenta', async ({ page }) => {
    await page.goto('/admin/cuenta');
    await expect(page).toHaveURL(/\/admin$/);
  });
});

test.describe('cambiar la contraseña', () => {
  let cuenta: CuentaTemporal;

  test.beforeEach(async () => {
    cuenta = await crearCuentaTemporal({ rol: 'caja' });
  });

  test.afterEach(async () => {
    await borrarCuentaTemporal(cuenta.id);
  });

  test('pide la actual, y despues se entra con la nueva', async ({ page }) => {
    await ingresarComo(page, cuenta.email, cuenta.contrasena);
    await expect(page).toHaveURL(/\/admin$/);
    await page.goto('/admin/cuenta');
    await page.getByLabel('Contraseña actual', { exact: true }).fill('no-es-la-actual');
    await page.getByLabel('Contraseña nueva', { exact: true }).fill('la-nueva-larga');
    await page.getByRole('button', { name: 'Cambiar contraseña' }).click();
    await expect(aviso(page)).toHaveText('Tu contraseña actual no coincide.');
    await page.getByLabel('Contraseña actual', { exact: true }).fill(cuenta.contrasena);
    await page.getByRole('button', { name: 'Cambiar contraseña' }).click();
    // Comprueba la actual y pone la nueva: son varios pedidos a Supabase por internet.
    await expect(page.getByRole('main').getByRole('status')).toHaveText(
      'Listo, cambiaste tu contraseña.',
      { timeout: 15_000 },
    );
    await page.getByRole('button', { name: 'Salir' }).click();
    // Sin esperar la salida, abrir el ingreso corta el pedido y la sesion sigue abierta.
    await expect(page).toHaveURL(/\/admin\/ingresar$/);
    await ingresarComo(page, cuenta.email, 'la-nueva-larga');
    await expect(page).toHaveURL(/\/admin$/);
  });

  test('quien entra con una contraseña temporal la tiene que cambiar antes de seguir', async ({
    page,
  }) => {
    await resetearComoAdmin(cuenta.id, 'temporal-12345');
    await ingresarComo(page, cuenta.email, 'temporal-12345');
    await expect(page).toHaveURL(/\/admin\/cambiar-contrasena$/);
    await page.goto('/admin/cuenta');
    await expect(page).toHaveURL(/\/admin\/cambiar-contrasena$/);
    await page.getByLabel('Contraseña nueva', { exact: true }).fill('la-nueva-larga');
    await page.getByRole('button', { name: 'Guardar contraseña' }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Hola, Cuenta temporal' }),
    ).toBeVisible();
  });
});
