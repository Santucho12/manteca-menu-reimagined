import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { emailDePrueba } from '../tests/cuentas';
import { borrarCuentaPorEmail } from '../tests/cuentas-temporales';
import { aviso } from './ayudas';

type Datos = { nombre: string; email: string; contrasena: string };

async function registrarse(page: Page, datos: Datos): Promise<void> {
  await page.goto('/admin/registro');
  await page.getByLabel('Nombre').fill(datos.nombre);
  await page.getByLabel('Email').fill(datos.email);
  await page.getByLabel('Contraseña', { exact: true }).fill(datos.contrasena);
  await page.getByRole('button', { name: 'Registrarme' }).click();
}

test('una persona se registra y queda esperando que le den acceso', async ({ page }) => {
  const email = `registro.${randomUUID()}@manteca.test`;
  try {
    await registrarse(page, { nombre: 'Lucía Registro', email, contrasena: 'una-clave-larga' });
    await expect(page).toHaveURL(/\/admin$/);
    await expect(
      page.getByText('Tu cuenta ya está creada. Un administrador tiene que darte acceso.'),
    ).toBeVisible();
    await expect(
      page.getByRole('banner').getByText('Lucía Registro', { exact: true }),
    ).toBeVisible();
  } finally {
    await borrarCuentaPorEmail(email);
  }
});

test('no deja registrar un email que ya tiene cuenta', async ({ page }) => {
  const datos = {
    nombre: 'Repetida',
    email: emailDePrueba('invitado'),
    contrasena: 'una-clave-larga',
  };
  await registrarse(page, datos);
  await expect(aviso(page)).toHaveText('Ya hay una cuenta con ese email.');
  await expect(page).toHaveURL(/\/admin\/registro$/);
});

test('marca los datos que faltan o que no sirven', async ({ page }) => {
  await registrarse(page, { nombre: '', email: 'ana', contrasena: 'corta' });
  await expect(page.getByLabel('Nombre')).toHaveAccessibleDescription('Escribí el nombre.');
  await expect(page.getByLabel('Email')).toHaveAccessibleDescription('Escribí un email válido.');
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAccessibleDescription(
    'La contraseña tiene que tener al menos 6 caracteres.',
  );
});

test('el ingreso y el registro se enlazan entre si', async ({ page }) => {
  await page.goto('/admin/ingresar');
  await page.getByRole('link', { name: 'Crear una cuenta' }).click();
  await expect(page).toHaveURL(/\/admin\/registro$/);
  await page.getByRole('main').getByRole('link', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/admin\/ingresar$/);
});

test('guarda una captura del registro', async ({ page }, info) => {
  await page.goto('/admin/registro');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `e2e/capturas/registro-${info.project.name}.png`, fullPage: true });
});
