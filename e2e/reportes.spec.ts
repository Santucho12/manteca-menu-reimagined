import { expect, test } from '@playwright/test';
import { SESIONES } from './ayudas';

test.use({ storageState: SESIONES.admin });

const TITULOS = [
  'Ventas por período',
  'Ventas por producto',
  'Ventas por categoría',
  'Gastos por categoría',
  'Gastos por período',
  'Caja',
  'Resultado',
];

test('la lista lleva a cada reporte', async ({ page }) => {
  await page.goto('/admin');
  await page.getByRole('link', { name: 'Reportes' }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Reportes' })).toBeVisible();
  const lista = page.getByRole('main').getByRole('list');
  for (const titulo of TITULOS) {
    await expect(lista.getByRole('link', { name: titulo, exact: true })).toBeVisible();
  }
});

for (const rol of ['caja', 'invitado'] as const) {
  test.describe(`con la sesion de ${rol}`, () => {
    test.use({ storageState: SESIONES[rol] });

    test('no entra a reportes', async ({ page }) => {
      await page.goto('/admin/reportes/ventas');
      await expect(page).toHaveURL(/\/admin$/);
    });
  });
}
