import { expect, test, type Page } from '@playwright/test';
import { SESIONES } from './ayudas';

const TODAS = [
  'Inicio',
  'Menú',
  'Ventas',
  'Proveedores',
  'Gastos',
  'Caja',
  'Reportes',
  'Usuarios',
  'Auditoría',
  'Mi cuenta',
];
const ABAJO = ['Inicio', 'Ventas', 'Gastos', 'Caja'];
const enLista = (nombres: string[]) => nombres.map((n) => new RegExp(`^${n}`));
const panel = (page: Page) => page.getByRole('navigation', { name: 'Panel' });

test.describe('con la sesion del admin', () => {
  test.use({ storageState: SESIONES.admin });

  test('la marca y el hero de Gastos, con la seccion marcada', async ({ page }) => {
    await page.goto('/admin/gastos/nuevo');
    await expect(page.getByText('Manteca', { exact: true }).locator('visible=true')).toHaveCount(1);
    const gastos = panel(page).getByRole('link', { name: /^Gastos/ });
    await expect(gastos).toHaveAttribute('aria-current', 'page');
    await page.goto('/admin/gastos');
    await expect(page.getByRole('heading', { level: 1, name: 'Gastos' })).toBeVisible();
    await expect(page.getByText('Lo que se pagó, por categoría y proveedor.')).toBeVisible();
  });

  test('en la computadora, la sidebar con todas las secciones', async ({ page }, info) => {
    test.skip(info.project.name !== 'computadora', 'solo en la computadora');
    await page.goto('/admin');
    await expect(page.getByText('Sistema de gestión')).toBeVisible();
    await expect(panel(page).getByRole('link')).toHaveText(enLista(TODAS));
    await expect(page.getByRole('button', { name: 'Más' })).toHaveCount(0);
  });

  test('en el celular, cuatro abajo y el resto en Más', async ({ page }, info) => {
    test.skip(info.project.name !== 'celular', 'solo en el celular');
    await page.goto('/admin');
    await expect(panel(page).getByRole('link')).toHaveText(enLista(ABAJO));
    await page.getByRole('button', { name: 'Más' }).click();
    const mas = page.getByRole('navigation', { name: 'Más secciones' });
    await expect(mas.getByRole('link')).toHaveText(
      enLista(TODAS.filter((n) => !ABAJO.includes(n))),
    );
    await mas.getByRole('link', { name: 'Reportes' }).click();
    await expect(page).toHaveURL(/\/admin\/reportes$/);
    await expect(mas).toHaveCount(0);
  });
});

test.describe('Más en el celular', () => {
  test.use({ storageState: SESIONES.admin });

  test('se cierra al tocar un icono de abajo, al tocar afuera y con Escape', async ({
    page,
  }, info) => {
    test.skip(info.project.name !== 'celular', 'solo en el celular');
    await page.goto('/admin');
    const mas = page.getByRole('navigation', { name: 'Más secciones' });
    await page.getByRole('button', { name: /^Más/ }).click();
    await panel(page)
      .getByRole('link', { name: /^Ventas/ })
      .click();
    await expect(page).toHaveURL(/\/admin\/ventas$/);
    await expect(mas).toHaveCount(0);
    await page.getByRole('button', { name: /^Más/ }).click();
    await page.getByRole('heading', { level: 1 }).click({ force: true });
    await expect(mas).toHaveCount(0);
    await page.getByRole('button', { name: /^Más/ }).click();
    await page.keyboard.press('Escape');
    await expect(mas).toHaveCount(0);
  });

  test('avisa con un numero que hay personas esperando, sin abrir Más', async ({ page }, info) => {
    test.skip(info.project.name !== 'celular', 'solo en el celular');
    // Las cuentas de prueba siempre dejan alguna pendiente: el invitado espera un rol.
    await page.goto('/admin');
    await expect(page.getByRole('button', { name: /^Más/ })).toContainText(/\d+/);
  });
});

test.describe('con la sesion de caja', () => {
  test.use({ storageState: SESIONES.caja });

  test('ve sus tres secciones, sin Más', async ({ page }) => {
    await page.goto('/admin/caja/mis-cierres');
    await expect(panel(page).getByRole('link')).toHaveText(
      enLista(['Cargar cierre', 'Mis cierres', 'Mi cuenta']),
    );
    await expect(panel(page).getByRole('link', { name: /^Mis cierres/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByRole('button', { name: 'Más' })).toHaveCount(0);
  });
});

test('guarda capturas del panel nuevo', async ({ browser }, info) => {
  const pagina = await (
    await browser.newContext({ ...info.project.use, storageState: SESIONES.admin })
  ).newPage();
  for (const ruta of ['', '/gastos', '/caja/control']) {
    await pagina.goto(`/admin${ruta}`);
    await pagina.evaluate(() => document.fonts.ready);
    const nombre = ruta.replaceAll('/', '-') || '-inicio';
    await pagina.screenshot({
      path: `e2e/capturas/panel${nombre}-${info.project.name}.png`,
      fullPage: true,
    });
  }
});
