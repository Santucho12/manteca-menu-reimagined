import { expect, test, type Page } from '@playwright/test';
import { SESIONES } from './ayudas';

// El numero de pendientes puede ir antes o despues del nombre ("3 Gastos", "Gastos 3").
const enLista = (nombres: string[]) => nombres.map((n) => new RegExp(`^(\\d+ ?)?${n}`));
const panel = (page: Page) => page.getByRole('navigation', { name: 'Panel' });

test.describe('con la sesion del admin', () => {
  test.use({ storageState: SESIONES.admin });

  test('la marca y el hero de Gastos, con la seccion marcada', async ({ page }) => {
    await page.goto('/admin/gastos/nuevo');
    await expect(page.getByRole('img', { name: 'Manteca' }).locator('visible=true')).toHaveCount(1);
    const gastos = panel(page).getByRole('link', { name: /^(\d+ ?)?Gastos/ });
    await expect(gastos).toHaveAttribute('aria-current', 'page');
    await page.goto('/admin/gastos');
    await expect(page.getByRole('heading', { level: 1, name: 'Gastos' })).toBeVisible();
    await expect(page.getByText('Lo que pagaste y lo que viene.')).toBeVisible();
  });

  test('el panel usa el dorado de Manteca sobre crema', async ({ page }, info) => {
    await page.goto('/admin');
    const tema = await page.evaluate(() => {
      const raiz = getComputedStyle(document.documentElement);
      return {
        principal: raiz.getPropertyValue('--color-primary').trim(),
        letraSobrePrincipal: raiz.getPropertyValue('--color-primary-foreground').trim(),
        fondo: raiz.getPropertyValue('--color-background').trim(),
      };
    });
    expect(tema).toEqual({
      principal: '#bfa042',
      letraSobrePrincipal: '#2b1d14',
      fondo: '#f4efe5',
    });
    // La barra de abajo del celular marca la activa con el color principal.
    if (info.project.name !== 'computadora') return;
    // En la lateral va en marrón oscuro, con la rayita dorada al costado.
    const inicio = panel(page).getByRole('link', { name: /^Inicio/ });
    await expect(inicio).toHaveCSS('color', 'rgb(43, 29, 20)');
  });

  test('Proveedores, Costos, Reportes, Auditoría y Mi cuenta avisan Próximamente', async ({
    page,
  }, info) => {
    test.skip(info.project.name !== 'computadora', 'solo en la computadora');
    await page.goto('/admin');
    for (const nombre of [/^Proveedores/, /^Costos/, /^Reportes/, /^Auditoría/, /^Mi cuenta/]) {
      await panel(page).getByRole('link', { name: nombre }).click();
      await expect(page.getByText('Próximamente').first()).toBeVisible();
      // El cartel es blanco, con sombra, simple (pedido 69) y en el medio de la pantalla.
      const cartel = page.getByRole('status').filter({ hasText: 'Próximamente' });
      await expect(cartel).toBeVisible();
      await expect(cartel).toHaveCSS('background-color', 'rgb(255, 255, 255)');
      await expect(cartel).not.toHaveCSS('box-shadow', 'none');
      const caja = (await cartel.boundingBox())!;
      const ventana = page.viewportSize()!;
      expect(caja.width).toBeGreaterThan(300);
      expect(Math.abs(caja.x + caja.width / 2 - ventana.width / 2)).toBeLessThan(10);
      expect(Math.abs(caja.y + caja.height / 2 - ventana.height / 2)).toBeLessThan(10);
      await expect(page).toHaveURL(/\/admin$/);
    }
    await panel(page)
      .getByRole('link', { name: /^Ventas/ })
      .click();
    await expect(page).toHaveURL(/\/admin\/ventas/);
  });

  test('en la computadora, Usuarios dice cuantos esperan un rol', async ({ page }, info) => {
    test.skip(info.project.name !== 'computadora', 'solo en la computadora');
    // Las cuentas de prueba siempre dejan alguna pendiente: el invitado espera un rol.
    await page.goto('/admin');
    await expect(panel(page).getByRole('link', { name: /^Usuarios/ })).toContainText(/\d+/);
  });
});

test.describe('con la sesion de caja', () => {
  test.use({ storageState: SESIONES.caja });

  test('ve sus tres secciones', async ({ page }) => {
    await page.goto('/admin/caja/mis-cierres');
    await expect(panel(page).getByRole('link')).toHaveText(
      enLista(['Cargar cierre', 'Mis cierres', 'Mi cuenta']),
    );
    await expect(panel(page).getByRole('link', { name: /^Mis cierres/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
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
