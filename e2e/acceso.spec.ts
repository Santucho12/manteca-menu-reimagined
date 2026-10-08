import { expect, test } from '@playwright/test';
import { clienteSecretoDePruebas } from '../tests/clientes';
import { emailDePrueba } from '../tests/cuentas';
import { borrarCuentaTemporal, crearCuentaTemporal } from '../tests/cuentas-temporales';
import { leerEntornoPruebas } from '../tests/entorno-pruebas';
import { SESIONES, aviso, ingresarComo } from './ayudas';

const DESACTIVADA = 'Tu cuenta está desactivada. Hablá con el administrador.';
const ESPERA = 'Tu cuenta ya está creada. Un administrador tiene que darte acceso.';

function contrasenaDePrueba(): string {
  return leerEntornoPruebas().CONTRASENA_USUARIOS_PRUEBA;
}

test.describe('sin sesion', () => {
  test('el panel manda al ingreso', async ({ page }) => {
    await page.goto('/admin/usuarios');
    await expect(page).toHaveURL(/\/admin\/ingresar$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Ingresar' })).toBeVisible();
  });

  // Un 307 repetiria el POST contra la pagina de ingreso; el 303 la pide con GET.
  test('un POST al panel sin sesion va al ingreso con 303', async ({ request }) => {
    const respuesta = await request.post('/admin/salir', { maxRedirects: 0 });
    expect(respuesta.status()).toBe(303);
    expect(respuesta.headers()['location']).toMatch(/\/admin\/ingresar$/);
  });

  test('si el email o la contraseña no coinciden, da un solo mensaje', async ({ page }) => {
    await ingresarComo(page, emailDePrueba('admin'), 'no-es-la-contraseña');
    await expect(aviso(page)).toHaveText(
      'El email o la contraseña no coinciden. Revisalos e intentá de nuevo.',
    );
    await expect(page).toHaveURL(/\/admin\/ingresar$/);
  });

  test('marca los campos vacios', async ({ page }) => {
    await page.goto('/admin/ingresar');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.getByLabel('Email')).toHaveAccessibleDescription('Escribí un email válido.');
    await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAccessibleDescription(
      'Escribí tu contraseña.',
    );
  });

  test('el admin ingresa, ve su nombre y sale', async ({ page }) => {
    await ingresarComo(page, emailDePrueba('admin'), contrasenaDePrueba());
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('banner').getByText('Prueba Admin', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Salir' }).click();
    await expect(page).toHaveURL(/\/admin\/ingresar$/);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/ingresar$/);
  });

  test('una cuenta desactivada no entra', async ({ page }) => {
    await ingresarComo(page, emailDePrueba('desactivado'), contrasenaDePrueba());
    await expect(page).toHaveURL(/\/admin\/ingresar\?motivo=desactivada$/);
    await expect(aviso(page)).toHaveText(DESACTIVADA);
  });

  test('una cuenta desactivada con la sesion abierta ve el aviso en el proximo pedido', async ({
    page,
  }) => {
    const cuenta = await crearCuentaTemporal({ rol: 'caja' });
    try {
      await ingresarComo(page, cuenta.email, cuenta.contrasena);
      await expect(page).toHaveURL(/\/admin$/);
      await clienteSecretoDePruebas()
        .from('perfiles')
        .update({ activo: false })
        .eq('id', cuenta.id);
      await page.reload();
      await expect(page).toHaveURL(/\/admin\/ingresar\?motivo=desactivada$/);
      await expect(aviso(page)).toHaveText(DESACTIVADA);
    } finally {
      await borrarCuentaTemporal(cuenta.id);
    }
  });

  test('guarda una captura del ingreso', async ({ page }, info) => {
    await page.goto('/admin/ingresar');
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `e2e/capturas/ingresar-${info.project.name}.png`,
      fullPage: true,
    });
  });
});

test.describe('con la sesion de caja', () => {
  test.use({ storageState: SESIONES.caja });

  test('ve su nombre, Mi cuenta y Salir, y nada mas', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { level: 1, name: 'Hola, Prueba Caja' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Panel' }).getByRole('link')).toHaveText([
      'Mi cuenta',
    ]);
    await expect(page.getByRole('button', { name: 'Salir' })).toBeVisible();
  });

  test('guarda una captura de su inicio', async ({ page }, info) => {
    await page.goto('/admin');
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `e2e/capturas/inicio-caja-${info.project.name}.png`,
      fullPage: true,
    });
  });
});

test.describe('con la sesion de un invitado', () => {
  test.use({ storageState: SESIONES.invitado });

  test('ve la espera, sin menu, y puede salir', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByText(ESPERA)).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Panel' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Salir' })).toBeVisible();
  });
});

test.describe('con la sesion del admin', () => {
  test.use({ storageState: SESIONES.admin });

  test('ve el inicio con las personas que esperan un rol', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { level: 1, name: 'Inicio' })).toBeVisible();
    await expect(
      page.getByText(/^(No hay personas|Hay \d+ personas?) esperando un rol\.$/),
    ).toBeVisible();
    const menu = page.getByRole('navigation', { name: 'Panel' });
    await expect(menu.getByRole('link')).toHaveText([
      /^Inicio/,
      /^Menú/,
      /^Usuarios/,
      /^Mi cuenta/,
    ]);
  });

  test('la guia de estilos ya no existe', async ({ page }) => {
    const respuesta = await page.goto('/admin/guia-de-estilos');
    expect(respuesta?.status()).toBe(404);
  });

  test('si ya tiene sesion, el ingreso lo manda al panel', async ({ page }) => {
    await page.goto('/admin/ingresar');
    await expect(page).toHaveURL(/\/admin$/);
  });
});
