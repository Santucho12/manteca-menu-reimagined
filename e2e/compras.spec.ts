import { expect, test, type Page } from '@playwright/test';
import { SiembraDeCompras } from '../tests/compras-de-prueba';
import { esperarHidratacion, SESIONES } from './ayudas';

test.use({ storageState: SESIONES.admin });

let siembra = new SiembraDeCompras();
test.afterEach(async () => {
  await siembra.borrar();
  siembra = new SiembraDeCompras();
});

async function cargarRenglon(page: Page, cantidad: string, precio: string) {
  await page.getByRole('button', { name: 'Agregar renglón' }).click();
  await page.getByLabel('Qué llegó 1').selectOption({ index: 1 });
  await page.getByLabel('Cantidad 1').fill(cantidad);
  await page.getByLabel('Precio 1').fill(precio);
}

test('carga una compra pagada: genera su gasto y el insumo toma el precio', async ({ page }) => {
  const proveedor = await siembra.proveedor();
  const forma = await siembra.forma(proveedor.id);
  await page.goto('/admin/compras/nueva');
  await esperarHidratacion(page.getByLabel('Proveedor'));
  await page.getByLabel('Proveedor').selectOption({ label: proveedor.nombre });
  await cargarRenglon(page, '2', '30.000');
  await expect(page.getByText('Total: $60.000,00')).toBeVisible();
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: `Compra a ${proveedor.nombre}` }),
  ).toBeVisible();
  await expect(page.getByText('Ver el gasto de esta compra')).toBeVisible();
  await page.goto(`/admin/materia-prima/${forma.insumoId}`);
  await expect(page.getByText('$1.200,00 el kg')).toBeVisible();
  await expect(page.getByText(/Compra del/).first()).toBeVisible();
});

test('arma un pedido, lo recibe y despues lo anula', async ({ page }) => {
  const proveedor = await siembra.proveedor({ telefono: '5491123456789' });
  await siembra.forma(proveedor.id);
  await page.goto('/admin/compras/pedido');
  await esperarHidratacion(page.getByLabel('Proveedor'));
  await page.getByLabel('Proveedor').selectOption({ label: proveedor.nombre });
  await page.getByRole('button', { name: 'Agregar renglón' }).click();
  await page.getByLabel('Qué llegó 1').selectOption({ index: 1 });
  await page.getByLabel('Cantidad 1').fill('3');
  await page.getByRole('button', { name: 'Guardar pedido' }).click();
  await expect(page.getByRole('link', { name: 'Mandar por WhatsApp' })).toHaveAttribute(
    'href',
    /wa\.me\/5491123456789\?text=/,
  );
  await page.getByRole('link', { name: 'Recibir' }).click();
  await expect(page.getByLabel('Cantidad 1')).toHaveValue('3');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Recibida', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Anular' }).click();
  await page.getByLabel('Motivo').fill('Vino mal');
  await page.getByRole('button', { name: 'Confirmar anulación' }).click();
  await expect(page.getByText('Anulada', { exact: true })).toBeVisible();
});

test('guarda capturas de la lista y de una compra', async ({ page }, info) => {
  await page.goto('/admin/compras');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `e2e/capturas/compras-${info.project.name}.png`, fullPage: true });
});

for (const rol of ['caja', 'invitado'] as const) {
  test.describe(`con la sesion de ${rol}`, () => {
    test.use({ storageState: SESIONES[rol] });

    test('no entra a compras', async ({ page }) => {
      await page.goto('/admin/compras');
      await expect(page).toHaveURL(/\/admin$/);
    });
  });
}
