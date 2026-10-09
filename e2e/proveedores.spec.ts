import { expect, test, type Page } from '@playwright/test';
import {
  borrarProveedores,
  idsDeProveedoresLlamados,
  nombreDeProveedor,
  sembrarProveedor,
} from '../tests/proveedores-de-prueba';
import { diaEnArgentina } from '../src/lib/fechas';
import { borrarGastos, sembrarGasto, sembrarRecurrente } from '../tests/gastos-de-prueba';
import { SESIONES } from './ayudas';

test.use({ storageState: SESIONES.admin });

let nombres: string[] = [];
let gastos: string[] = [];
let recurrentes: string[] = [];
test.afterEach(async () => {
  await borrarGastos({ gastos, recurrentes });
  gastos = [];
  recurrentes = [];
  await borrarProveedores(await idsDeProveedoresLlamados(nombres));
  nombres = [];
});

function nuevoNombre(): string {
  const nombre = nombreDeProveedor();
  nombres.push(nombre);
  return nombre;
}

async function completar(page: Page, nombre: string, telefono = '11 2345-6789') {
  await page.goto('/admin/proveedores/nuevo');
  await page.getByLabel('Nombre').fill(nombre);
  await page.getByLabel('Teléfono de WhatsApp').fill(telefono);
  await page.getByLabel('Qué le comprás').fill('Harina 000');
  await page.getByLabel('Observaciones').fill('Alias: molino.sur');
  await page.getByRole('button', { name: 'Guardar' }).click();
}

function fila(page: Page, nombre: string) {
  return page.getByRole('listitem').filter({ hasText: nombre });
}

test('carga un proveedor y se ve en la ficha con su WhatsApp', async ({ page }) => {
  const nombre = nuevoNombre();
  await completar(page, nombre);
  await expect(page.getByRole('heading', { level: 1, name: nombre })).toBeVisible();
  await expect(page.getByText('+54 9 11 2345-6789')).toBeVisible();
  await expect(page.getByText('Alias: molino.sur')).toBeVisible();
  await expect(page.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute(
    'href',
    'https://wa.me/5491123456789',
  );
});

test('un nombre repetido avisa y deja cargarlo igual', async ({ page }) => {
  const nombre = nuevoNombre();
  await sembrarProveedor({ nombre });
  await completar(page, nombre.toLowerCase());
  nombres.push(nombre.toLowerCase());
  await expect(
    page.getByText(`Ya hay un proveedor llamado ${nombre}. ¿Lo cargás igual?`),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cargar igual' }).click();
  await expect(page.getByRole('heading', { level: 1, name: nombre.toLowerCase() })).toBeVisible();
});

test('Volver cierra el aviso y Cargar igual guarda lo que esta en pantalla', async ({ page }) => {
  const nombre = nuevoNombre();
  await sembrarProveedor({ nombre });
  await completar(page, nombre);
  const aviso = page.getByRole('alertdialog');
  await expect(aviso).toBeVisible();
  await page.getByRole('button', { name: 'Volver' }).click();
  await expect(aviso).toHaveCount(0);
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(aviso).toBeVisible();
  const otro = nuevoNombre();
  await page.getByLabel('Nombre').fill(otro);
  await page.getByRole('button', { name: 'Cargar igual' }).click();
  await expect(page.getByRole('heading', { level: 1, name: otro })).toBeVisible();
});

test('explica un telefono que no sirve', async ({ page }) => {
  await completar(page, nuevoNombre(), '15 2345 6789');
  await expect(page.getByLabel('Teléfono de WhatsApp')).toHaveAccessibleDescription(
    'Escribí el número con la característica y sin el 15, por ejemplo 11 2345 6789.',
  );
});

test('busca por nombre, y sin telefono no hay boton de WhatsApp', async ({ page }) => {
  const nombre = nuevoNombre();
  await sembrarProveedor({ nombre });
  await page.goto('/admin/proveedores');
  await page.getByLabel('Buscar por nombre').fill(nombre);
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(fila(page, nombre)).toHaveCount(1);
  await expect(fila(page, nombre).getByRole('link', { name: 'WhatsApp' })).toHaveCount(0);
});

test('edita, desactiva y reactiva', async ({ page }) => {
  const nombre = nuevoNombre();
  const proveedor = await sembrarProveedor({ nombre });
  await page.goto(`/admin/proveedores/${proveedor.id}`);
  await page.getByRole('link', { name: 'Editar' }).click();
  await page.getByLabel('Ubicación').fill('Parque industrial');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Parque industrial')).toBeVisible();
  await page.getByRole('button', { name: 'Desactivar' }).click();
  await expect(page.getByText('Desactivado', { exact: true })).toBeVisible();
  await page.goto(`/admin/proveedores?q=${encodeURIComponent(nombre)}`);
  await expect(fila(page, nombre)).toHaveCount(0);
  await page.getByRole('link', { name: 'Ver desactivados' }).click();
  await fila(page, nombre).getByRole('link', { name: nombre }).click();
  await page.getByRole('button', { name: 'Reactivar' }).click();
  await expect(page.getByRole('button', { name: 'Desactivar' })).toBeVisible();
});

test('muestra lo pagado en el mes en la lista y los gastos y totales en la ficha', async ({
  page,
}) => {
  const nombre = nuevoNombre();
  const proveedor = await sembrarProveedor({ nombre });
  const hoy = diaEnArgentina(new Date());
  const pago = { categoria: 'Mercadería', proveedorId: proveedor.id, fecha: hoy };
  gastos.push((await sembrarGasto({ ...pago, montoCentavos: 300000 })).id);
  gastos.push((await sembrarGasto({ ...pago, montoCentavos: 999, anulado: true })).id);
  await page.goto(`/admin/proveedores?q=${encodeURIComponent(nombre)}`);
  await expect(fila(page, nombre)).toContainText('Pagado este mes: $3.000,00');
  await fila(page, nombre).getByRole('link', { name: nombre }).click();
  await expect(page.getByText('Este mes: $3.000,00')).toBeVisible();
  await expect(page.getByText('Este año: $3.000,00')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Gastos' }).getByRole('listitem')).toHaveCount(2);
});

test('avisa si tiene gastos recurrentes activos', async ({ page }) => {
  const proveedor = await sembrarProveedor({ nombre: nuevoNombre() });
  const recurrente = await sembrarRecurrente({
    categoria: 'Mercadería',
    proveedorId: proveedor.id,
    primerVencimiento: '2099-01-01',
  });
  recurrentes.push(recurrente.id);
  await page.goto(`/admin/proveedores/${proveedor.id}`);
  await expect(page.getByText(/Tiene 1 gasto recurrente activo/)).toBeVisible();
});

test('guarda capturas de la lista y la ficha', async ({ page }, info) => {
  const nombre = nuevoNombre();
  const proveedor = await sembrarProveedor({ nombre, telefono: '5491123456789' });
  await page.goto('/admin/proveedores');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `e2e/capturas/proveedores-${info.project.name}.png`,
    fullPage: true,
  });
  await page.goto(`/admin/proveedores/${proveedor.id}`);
  await page.screenshot({
    path: `e2e/capturas/proveedor-${info.project.name}.png`,
    fullPage: true,
  });
});

for (const rol of ['caja', 'invitado'] as const) {
  test.describe(`con la sesion de ${rol}`, () => {
    test.use({ storageState: SESIONES[rol] });

    test('no entra a proveedores', async ({ page }) => {
      await page.goto('/admin/proveedores');
      await expect(page).toHaveURL(/\/admin$/);
    });
  });
}
