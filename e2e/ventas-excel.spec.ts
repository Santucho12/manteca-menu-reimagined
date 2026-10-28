import { expect, test } from '@playwright/test';
import { clienteSecretoDePruebas } from '../tests/clientes';
import { borrarVentas } from '../tests/ventas-de-prueba';
import { SESIONES, aviso } from './ayudas';

test.use({ storageState: SESIONES.admin });

const EXCEL = 'e2e/archivos/reporte-ventas-fudo.xlsx';

// El Excel de prueba trae tres dias de marzo de 2020: ninguna venta de demostracion cae ahi.
test.afterEach(async () => {
  const { data } = await clienteSecretoDePruebas()
    .from('ventas')
    .select('id')
    .like('fudo_id', 'excel:2020-03-%');
  await borrarVentas((data ?? []).map((v) => v.id));
});

test('desde Ventas se llega a subir el Excel de Fudo', async ({ page }) => {
  await page.goto('/admin/ventas');
  await page.getByRole('link', { name: 'Subir Excel de Fudo' }).click();
  await expect(page).toHaveURL(/\/admin\/ventas\/subir$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Subir Excel de Fudo' })).toBeVisible();
});

test('muestra lo que entra antes de guardar, y recien al confirmar lo guarda', async ({ page }) => {
  await page.goto('/admin/ventas/subir');
  await page.getByLabel('Reporte de ventas de Fudo').setInputFiles(EXCEL);
  await page.getByRole('button', { name: 'Revisar archivo' }).click();
  const vista = page.getByRole('region', { name: 'Lo que entra' });
  await expect(vista).toContainText('11 ventas');
  await expect(vista).toContainText('3 días');
  await expect(vista).toContainText('02/03/2020');
  await expect(vista).toContainText('$63.501,00');
  const antes = await clienteSecretoDePruebas()
    .from('ventas')
    .select('id', { count: 'exact', head: true })
    .like('fudo_id', 'excel:2020-03-%');
  expect(antes.count).toBe(0);
  await page.getByRole('button', { name: 'Guardar ventas' }).click();
  await expect(page.getByText('Listo: 11 ventas nuevas.')).toBeVisible();
  await page.goto('/admin/ventas?desde=2020-03-02&hasta=2020-03-04&origen=fudo');
  const resumen = page.getByRole('region', { name: 'Resumen de ventas' });
  await expect(resumen).toContainText('$63.501,00');
  await expect(resumen).toContainText('11 ventas');
});

test('subir el mismo archivo dos veces no suma otra vez', async ({ page }) => {
  for (const mensaje of ['Listo: 11 ventas nuevas.', 'Listo: no había nada nuevo.']) {
    await page.goto('/admin/ventas/subir');
    await page.getByLabel('Reporte de ventas de Fudo').setInputFiles(EXCEL);
    await page.getByRole('button', { name: 'Revisar archivo' }).click();
    await page.getByRole('button', { name: 'Guardar ventas' }).click();
    await expect(page.getByText(mensaje)).toBeVisible();
  }
});

test('un archivo que no es el reporte de Fudo se explica y no se guarda', async ({ page }) => {
  await page.goto('/admin/ventas/subir');
  await page
    .getByLabel('Reporte de ventas de Fudo')
    .setInputFiles('e2e/archivos/foto-de-prueba.jpg');
  await page.getByRole('button', { name: 'Revisar archivo' }).click();
  await expect(aviso(page)).toContainText('No pudimos abrir el archivo');
  await expect(page.getByRole('button', { name: 'Guardar ventas' })).toHaveCount(0);
});

test('sin elegir un archivo pide elegirlo', async ({ page }) => {
  await page.goto('/admin/ventas/subir');
  await page.getByRole('button', { name: 'Revisar archivo' }).click();
  await expect(aviso(page)).toContainText('Elegí el archivo');
});

test('muestra el archivo elegido y se puede quitar', async ({ page }) => {
  await page.goto('/admin/ventas/subir');
  await page.getByLabel('Reporte de ventas de Fudo').setInputFiles(EXCEL);
  const elegido = page.getByRole('region', { name: 'Archivo elegido' });
  await expect(elegido).toContainText('reporte-ventas-fudo.xlsx');
  await elegido.getByRole('button', { name: 'Quitar archivo' }).click();
  await expect(page.getByRole('region', { name: 'Archivo elegido' })).toHaveCount(0);
  await expect(page.getByText('Arrastrá el reporte de Fudo acá')).toBeVisible();
});
