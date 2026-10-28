import { expect, test } from '@playwright/test';
import { diaEnArgentina } from '../src/lib/fechas';
import {
  borrarCategoriasConSusGastos,
  sembrarCategoriaDeGasto,
  sembrarGasto,
} from '../tests/gastos-de-prueba';
import { borrarMenuDePrueba, sembrarCategoria, sembrarProducto } from '../tests/menu-de-prueba';
import { borrarProveedores, sembrarProveedor } from '../tests/proveedores-de-prueba';
import { SESIONES } from './ayudas';

test.use({ storageState: SESIONES.admin });

const HOY = diaEnArgentina(new Date());
let categorias: string[] = [];
let proveedores: string[] = [];
let menu: string[] = [];
test.afterEach(async () => {
  await borrarCategoriasConSusGastos(categorias);
  await borrarProveedores(proveedores);
  await borrarMenuDePrueba(menu);
  categorias = [];
  proveedores = [];
  menu = [];
});

async function categoria() {
  const sembrada = await sembrarCategoriaDeGasto();
  categorias.push(sembrada.id);
  return sembrada;
}

test('el cambio de un gasto se ve con nombres y pesos, y lleva al gasto', async ({ page }) => {
  const antes = await categoria();
  const despues = await categoria();
  const gasto = await sembrarGasto({ categoriaId: antes.id, fecha: HOY, montoCentavos: 50000 });
  await page.goto(`/admin/gastos/${gasto.id}`);
  await page.getByLabel('Categoría').selectOption({ label: despues.nombre });
  await page.getByLabel('Monto').fill('600');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page).toHaveURL(/\/admin\/gastos$/);
  await page.goto('/admin/auditoria');
  await page.getByLabel('Módulo').selectOption({ label: 'Gastos' });
  await page.getByLabel('Acción').selectOption({ label: 'Cambio' });
  await expect(page).toHaveURL(/modulo=gastos&accion=cambio/);
  const registro = page.getByRole('list', { name: 'Registros' }).getByRole('listitem').first();
  await expect(registro).toContainText('Prueba Admin');
  await expect(registro).toContainText('Gastos · Gasto');
  await registro.getByRole('link', { name: 'Ver el detalle' }).click();
  // El detalle resuelve nombres en la base: con la maquina cargada tarda mas que la espera comun.
  await expect(page).toHaveURL(/\/admin\/auditoria\/\d+$/, { timeout: 15_000 });
  const cambios = page.getByRole('list', { name: 'Cambios' });
  await expect(cambios).toContainText(`Categoría${antes.nombre}${despues.nombre}`);
  await expect(cambios).toContainText('Monto$500,00$600,00');
  await page.getByRole('link', { name: 'Ver el dato' }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/gastos/${gasto.id}$`));
});

test('filtra lo del sistema y explica que no hay nada', async ({ page }) => {
  const proveedor = await sembrarProveedor();
  proveedores.push(proveedor.id);
  await page.goto('/admin/auditoria?persona=sistema&modulo=proveedores');
  const registro = page.getByRole('list', { name: 'Registros' }).getByRole('listitem').first();
  await expect(registro).toContainText(`Proveedores · Proveedor · ${proveedor.nombre}`);
  await expect(registro).toContainText('El sistema');
  await expect(registro).toContainText('Alta');
  await page.goto('/admin/auditoria?desde=2001-01-01&hasta=2001-01-02');
  await expect(page.getByText('No hay registros para mostrar.')).toBeVisible();
});

test('las fichas dicen quien cargo el dato y cuando', async ({ page }) => {
  const { id } = await categoria();
  const gasto = await sembrarGasto({ categoriaId: id, fecha: HOY });
  await page.goto(`/admin/gastos/${gasto.id}`);
  await expect(
    page.getByText(/^Cargado por El sistema el \d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/),
  ).toBeVisible();
  const proveedor = await sembrarProveedor();
  proveedores.push(proveedor.id);
  await page.goto(`/admin/proveedores/${proveedor.id}`);
  await expect(page.getByText(/^Cargado por El sistema el /)).toBeVisible();
  const delMenu = await sembrarCategoria();
  menu.push(delMenu.id);
  const producto = await sembrarProducto(delMenu);
  await page.goto(`/admin/menu/productos/${producto.id}`);
  await expect(page.getByText(/^Cargado por El sistema el /)).toBeVisible();
});

test('un registro que no existe da 404', async ({ page }) => {
  const respuesta = await page.goto('/admin/auditoria/abc');
  expect(respuesta?.status()).toBe(404);
});

test('guarda capturas de la lista y el detalle', async ({ page }, info) => {
  const { id } = await categoria();
  await sembrarGasto({ categoriaId: id, fecha: HOY });
  await page.goto('/admin/auditoria?modulo=gastos');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `e2e/capturas/auditoria-${info.project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole('list', { name: 'Registros' })
    .getByRole('link', { name: 'Ver el detalle' })
    .first()
    .click();
  await expect(page.getByRole('list', { name: 'Cambios' })).toBeVisible({ timeout: 15_000 });
  await page.screenshot({
    path: `e2e/capturas/auditoria-registro-${info.project.name}.png`,
    fullPage: true,
  });
});

for (const rol of ['caja', 'invitado'] as const) {
  test.describe(`con la sesion de ${rol}`, () => {
    test.use({ storageState: SESIONES[rol] });

    test('no entra a la auditoria', async ({ page }) => {
      await page.goto('/admin/auditoria');
      await expect(page).toHaveURL(/\/admin$/);
    });
  });
}
