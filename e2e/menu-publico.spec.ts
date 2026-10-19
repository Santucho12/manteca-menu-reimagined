import { expect, test, type Page } from '@playwright/test';
import { borrarMenuDePrueba, sembrarCategoria, sembrarProducto } from '../tests/menu-de-prueba';

function seccion(page: Page, nombre: string) {
  return page.getByRole('region', { name: nombre });
}

test('muestra el menu de hoy con sus precios', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Manteca — Panadería Artesanal');
  const facturas = seccion(page, 'Facturas');
  await expect(
    facturas.getByText('Docena $20.000 · Media docena $12.000 · Unidad $3.000'),
  ).toBeVisible();
  await expect(facturas.getByRole('listitem').filter({ hasText: 'Medialuna' })).toContainText(
    '🔥 Más vendido',
  );
  const capuccino = seccion(page, 'Cafetería')
    .getByRole('listitem')
    .filter({ hasText: 'Capuccino' });
  await expect(capuccino).toContainText('—');
  await expect(capuccino).toContainText('$6.100');
  await expect(
    seccion(page, 'Laminados').getByRole('listitem').filter({ hasText: 'Croissant relleno' }),
  ).toContainText('$7.000');
});

test('la pestaña muestra la medialuna como ícono', async ({ page, request }) => {
  await page.goto('/');
  const icono = await page.locator('link[rel="icon"]').first().getAttribute('href');
  expect(icono).toBeTruthy();
  const respuesta = await request.get(icono!);
  expect(respuesta.ok()).toBe(true);
  expect(await respuesta.text()).toContain('🥐');
});

test('tocar un producto muestra su descripcion', async ({ page }) => {
  await page.goto('/');
  const croissant = seccion(page, 'Laminados')
    .getByRole('button', { name: /^Croissant\b/ })
    .first();
  await croissant.click();
  await expect(seccion(page, 'Laminados').getByText(/técnica francesa/)).toBeVisible();
});

test('la navegacion lleva a cada categoria', async ({ page }, info) => {
  await page.goto('/');
  if (info.project.name === 'celular')
    await page.getByRole('button', { name: /Productos/ }).click();
  await page
    .getByRole('navigation', { name: 'Categorías' })
    .getByRole('link', { name: /Panes/ })
    .click();
  await expect(page).toHaveURL(/#panes$/);
  await expect(seccion(page, 'Panes')).toBeInViewport();
});

test('un producto oculto no sale y uno visible si, sin publicar nada', async ({ page }) => {
  const categoria = await sembrarCategoria();
  try {
    const visible = await sembrarProducto(categoria, { precios: [123400] });
    const oculto = await sembrarProducto(categoria, { visible: false });
    await page.goto('/');
    const lista = seccion(page, categoria.nombre);
    await expect(lista.getByText(visible.nombre)).toBeVisible();
    await expect(lista.getByText('$1.234')).toBeVisible();
    await expect(page.getByText(oculto.nombre)).toHaveCount(0);
  } finally {
    await borrarMenuDePrueba([categoria.id]);
  }
});

test('guarda una captura del menu', async ({ page }, info) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  // Las secciones aparecen al scrollear: se recorren para que la captura las muestre.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
  });
  await page.screenshot({
    path: `e2e/capturas/menu-publico-${info.project.name}.png`,
    fullPage: true,
  });
});
