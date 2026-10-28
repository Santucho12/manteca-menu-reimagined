import { randomUUID } from 'node:crypto';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { emailDePrueba } from '../tests/cuentas';
import { borrarCuentaTemporal, crearCuentaTemporal } from '../tests/cuentas-temporales';
import { SESIONES, abrirSinSesion, aviso, enlaceDeSeccion, ingresarComo } from './ayudas';

const DESACTIVADA = 'Tu cuenta está desactivada. Hablá con el administrador.';
const ESPERA = 'Tu cuenta ya está creada. Un administrador tiene que darte acceso.';

test.use({ storageState: SESIONES.admin });

function tarjeta(page: Page, email: string): Locator {
  return page
    .getByRole('list', { name: 'Cuentas' })
    .getByRole('listitem')
    .filter({ hasText: email });
}

async function abrirLaCuenta(page: Page, email: string): Promise<Locator> {
  await page.goto(`/admin/usuarios?q=${encodeURIComponent(email)}`);
  const fila = tarjeta(page, email);
  await expect(fila).toBeVisible();
  return fila;
}

// Resetear y corregir viven detrás de los tres puntitos de la tarjeta.
async function abrirElMenu(page: Page, fila: Locator, opcion: string) {
  await fila.getByRole('button', { name: 'Más acciones' }).click();
  await page.getByRole('menuitem', { name: opcion }).click();
}

test('quien espera recibe el rol de Caja y entra al recargar', async ({ page, browser }) => {
  const cuenta = await crearCuentaTemporal();
  const persona = await abrirSinSesion(browser);
  try {
    await ingresarComo(persona, cuenta.email, cuenta.contrasena);
    await expect(persona.getByRole('main').getByText(ESPERA)).toBeVisible();
    const fila = await abrirLaCuenta(page, cuenta.email);
    await expect(fila.getByRole('combobox', { name: 'Rol' })).toHaveText('Pendiente');
    await fila.getByRole('combobox', { name: 'Rol' }).click();
    await page.getByRole('option', { name: 'Caja' }).click();
    await expect(fila.getByText('Activa', { exact: true })).toBeVisible();
    await persona.reload();
    await expect(
      persona.getByRole('heading', { level: 1, name: 'Hola, Cuenta temporal' }),
    ).toBeVisible();
  } finally {
    await persona.context().close();
    await borrarCuentaTemporal(cuenta.id);
  }
});

test('una cuenta con rol puede volver a pendiente', async ({ page }) => {
  const cuenta = await crearCuentaTemporal({ rol: 'caja' });
  try {
    const fila = await abrirLaCuenta(page, cuenta.email);
    await fila.getByRole('combobox', { name: 'Rol' }).click();
    await page.getByRole('option', { name: 'Pendiente' }).click();
    await expect(fila.getByRole('combobox', { name: 'Rol' })).toHaveText('Pendiente');
  } finally {
    await borrarCuentaTemporal(cuenta.id);
  }
});

test('rechazar a quien espera pide confirmacion y deja la cuenta rechazada', async ({ page }) => {
  const cuenta = await crearCuentaTemporal();
  try {
    const fila = await abrirLaCuenta(page, cuenta.email);
    await fila.getByRole('button', { name: 'Rechazar' }).click();
    await expect(
      fila.getByText(
        '¿Rechazar a Cuenta temporal? No va a poder entrar ni volver a registrarse con ese email.',
      ),
    ).toBeVisible();
    await fila.getByRole('button', { name: 'Sí, rechazar' }).click();
    await expect(fila.getByText('Rechazada', { exact: true })).toBeVisible();
  } finally {
    await borrarCuentaTemporal(cuenta.id);
  }
});

test('el filtro Esperando rol y la busqueda encuentran a quien espera', async ({ page }) => {
  const cuenta = await crearCuentaTemporal();
  try {
    await page.goto('/admin/usuarios');
    await page.getByRole('combobox', { name: 'Estado' }).click();
    await page.getByRole('option', { name: 'Esperando rol' }).click();
    await expect(page).toHaveURL(/estado=pendientes/);
    await expect(page.getByRole('button', { name: 'Buscar' })).toHaveCount(0);
    await page.getByLabel('Buscar por nombre o email').fill(cuenta.email);
    await expect(page).toHaveURL(/q=temporal/);
    await expect(page.getByRole('list', { name: 'Cuentas' }).getByRole('listitem')).toHaveCount(1);
    await expect(tarjeta(page, cuenta.email)).toBeVisible();
    await expect(await enlaceDeSeccion(page, 'Usuarios')).toContainText(/\d+/);
  } finally {
    await borrarCuentaTemporal(cuenta.id);
  }
});

test('desactivar pide confirmacion y la persona pierde el acceso en el momento', async ({
  page,
  browser,
}) => {
  const cuenta = await crearCuentaTemporal({ rol: 'caja' });
  const persona = await abrirSinSesion(browser);
  try {
    await ingresarComo(persona, cuenta.email, cuenta.contrasena);
    await expect(persona).toHaveURL(/\/admin$/);
    const fila = await abrirLaCuenta(page, cuenta.email);
    const activa = fila.getByRole('switch', { name: 'Cuenta activa' });
    await expect(activa).toBeChecked();
    await activa.click();
    await expect(
      fila.getByText('¿Desactivar a Cuenta temporal? Pierde el acceso en el momento.'),
    ).toBeVisible();
    await fila.getByRole('button', { name: 'Sí, desactivar' }).click();
    await expect(fila.getByText('Desactivada', { exact: true })).toBeVisible();
    await persona.reload();
    await expect(aviso(persona)).toHaveText(DESACTIVADA);
    await expect(activa).not.toBeChecked();
    await activa.click();
    await expect(fila.getByText('Activa', { exact: true })).toBeVisible();
    await ingresarComo(persona, cuenta.email, cuenta.contrasena);
    await expect(persona).toHaveURL(/\/admin$/);
  } finally {
    await persona.context().close();
    await borrarCuentaTemporal(cuenta.id);
  }
});

test('resetear muestra la contraseña temporal una sola vez y obliga a cambiarla', async ({
  page,
  browser,
}) => {
  const cuenta = await crearCuentaTemporal({ rol: 'caja' });
  const persona = await abrirSinSesion(browser);
  try {
    const fila = await abrirLaCuenta(page, cuenta.email);
    await abrirElMenu(page, fila, 'Resetear contraseña');
    await fila.getByRole('button', { name: 'Sí, resetear' }).click();
    await expect(
      fila.getByText(
        'Pasale esta contraseña a Cuenta temporal. Se la vamos a pedir cambiar apenas entre. No la vas a poder ver de nuevo.',
      ),
    ).toBeVisible();
    const salida = fila.getByRole('status', { name: 'Contraseña temporal' });
    const temporal = ((await salida.textContent()) ?? '').trim();
    expect(temporal).toMatch(/^[A-HJ-NP-Za-km-np-z2-9]{12}$/);
    await page.reload();
    await expect(salida).toHaveCount(0);
    await ingresarComo(persona, cuenta.email, temporal);
    await expect(persona).toHaveURL(/\/admin\/cambiar-contrasena$/);
    await persona.getByLabel('Contraseña nueva', { exact: true }).fill('la-nueva-larga');
    await persona.getByRole('button', { name: 'Guardar contraseña' }).click();
    await expect(persona).toHaveURL(/\/admin$/);
  } finally {
    await persona.context().close();
    await borrarCuentaTemporal(cuenta.id);
  }
});

test('el admin corrige el nombre y el email de una cuenta', async ({ page }) => {
  const cuenta = await crearCuentaTemporal({ rol: 'caja' });
  const nuevo = `corregido.${randomUUID()}@manteca.test`;
  try {
    const fila = await abrirLaCuenta(page, cuenta.email);
    await abrirElMenu(page, fila, 'Corregir datos');
    await fila.getByLabel('Nombre', { exact: true }).fill('Nombre corregido');
    await fila.getByLabel('Email', { exact: true }).fill(nuevo);
    await fila.getByRole('button', { name: 'Guardar' }).click();
    // La lista estaba filtrada por el email viejo: la cuenta corregida ya no aparece ahi.
    await expect(fila).toHaveCount(0);
    const corregida = await abrirLaCuenta(page, nuevo);
    await expect(corregida.getByText('Nombre corregido', { exact: true })).toBeVisible();
  } finally {
    await borrarCuentaTemporal(cuenta.id);
  }
});

test('sobre su propia cuenta el admin solo corrige los datos', async ({ page }) => {
  const fila = await abrirLaCuenta(page, emailDePrueba('admin'));
  await fila.getByRole('button', { name: 'Más acciones' }).click();
  await expect(page.getByRole('menuitem')).toHaveText(['Corregir datos']);
});

test('guarda una captura de Usuarios', async ({ page }, info) => {
  await page.goto('/admin/usuarios');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `e2e/capturas/usuarios-${info.project.name}.png`, fullPage: true });
});

for (const rol of ['caja', 'invitado'] as const) {
  test.describe(`con la sesion de ${rol}`, () => {
    test.use({ storageState: SESIONES[rol] });

    test('no entra a Usuarios', async ({ page }) => {
      await page.goto('/admin/usuarios');
      await expect(page).toHaveURL(/\/admin$/);
    });
  });
}
