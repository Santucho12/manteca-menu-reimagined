import { expect, test, type Page } from '@playwright/test';
import { cuentasDeEjemplo } from '../scripts/ejemplos/cuentas';
import { PROVEEDORES_DE_EJEMPLO } from '../scripts/ejemplos/gastos';
import {
  borrarLocalDeEjemplo,
  sembrarEjemplos,
  type OpcionesDeEjemplo,
  type ResumenDeEjemplo,
} from '../scripts/ejemplos/sembrar';
import { diaEnArgentina } from '../src/lib/fechas';
import { clienteSecretoDePruebas } from '../tests/clientes';
import { leerEntornoPruebas } from '../tests/entorno-pruebas';
import { ingresarComo } from './ayudas';

// Un local de ejemplo chico, aparte del que arma `npm run sembrar:ejemplos` (pedido 93): los
// datos de ejemplo no tienen pantalla propia y se ven entrando con sus cuentas.
const opciones = (): OpcionesDeEjemplo => ({
  hoy: diaEnArgentina(new Date()),
  dias: 6,
  semilla: 93,
  local: 'Local de ejemplo (en vivo)',
  prefijo: 'ejemplo.envivo',
  contrasena: leerEntornoPruebas().CONTRASENA_USUARIOS_PRUEBA,
});
const [admin, caja] = cuentasDeEjemplo(opciones().prefijo);
// Las ventas y los cierres del ejemplo caen en sus últimos días: diez para atrás los cubren.
const desde = new Date(Date.now() - 10 * 86_400_000).toISOString().slice(0, 10);

test.use({ storageState: { cookies: [], origins: [] } });

let resumen: ResumenDeEjemplo;
test.beforeAll(async () => {
  resumen = await sembrarEjemplos(clienteSecretoDePruebas(), opciones());
});
test.afterAll(() => borrarLocalDeEjemplo(clienteSecretoDePruebas(), opciones()));

async function entrar(page: Page, email: string) {
  await ingresarComo(page, email, opciones().contrasena);
  await expect(page).toHaveURL(/\/admin$/);
}

// La fila de la lista que nombra algo: la de la tabla en la computadora, la tarjeta en el celular.
const filaCon = (page: Page, texto: string) =>
  page
    .getByRole('main')
    .getByRole('listitem')
    .filter({ hasText: texto })
    .locator('visible=true')
    .first();

test('el admin del ejemplo ve las ventas de su local, y solo esas', async ({ page }) => {
  await entrar(page, admin!.email);
  await page.goto(`/admin/ventas?desde=${desde}&hasta=${opciones().hoy}`);
  await expect(page.getByRole('main')).toContainText(`${resumen.ventas} Resultados`);
});

test('el admin del ejemplo ve los cierres que cargó su caja', async ({ page }) => {
  await entrar(page, admin!.email);
  await page.goto(`/admin/caja/control?desde=${desde}&hasta=${opciones().hoy}`);
  await expect(filaCon(page, caja!.nombre)).toBeVisible();
});

test('el admin del ejemplo ve sus proveedores', async ({ page }) => {
  await entrar(page, admin!.email);
  await page.goto('/admin/proveedores');
  for (const { nombre } of PROVEEDORES_DE_EJEMPLO)
    await expect(filaCon(page, nombre)).toBeVisible();
});

test('la caja del ejemplo vende con el menú copiado', async ({ page }) => {
  await entrar(page, caja!.email);
  await page.goto('/admin/vender');
  const categorias = page.getByRole('group', { name: 'Categorías' }).getByRole('button');
  await expect(categorias.first()).toBeVisible();
});
