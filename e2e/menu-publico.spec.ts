import { expect, test, type Locator, type Page } from '@playwright/test';
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

// Los textos de una tarjeta que quedan fuera de ella (se salen o se meten en la de al lado).
const fueraDeLaTarjeta = (tarjeta: Locator) =>
  tarjeta.evaluate((li) => {
    const caja = li.getBoundingClientRect();
    return [...li.querySelectorAll<HTMLElement>('*')]
      .filter((e) => e.children.length === 0 && e.textContent!.trim())
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.right > caja.right + 1 || r.left < caja.left - 1;
      })
      .map((e) => e.textContent!.trim());
  });

test('un producto con tres precios propios los muestra enteros, debajo del nombre y en una fila', async ({
  page,
}) => {
  const categoria = await sembrarCategoria({
    presentaciones: ['Docena', 'Media docena', 'Unidad'],
    compartidos: [2000000, 1200000, 300000],
  });
  try {
    const tres = await sembrarProducto(categoria, {
      precios: [2200000, 1400000, 350000],
      etiqueta: 'mas_vendido',
    });
    const uno = await sembrarProducto(categoria, { precios: [null, null, 350000] });
    await page.goto('/');
    const tarjeta = (nombre: string) =>
      seccion(page, categoria.nombre).getByRole('listitem').filter({ hasText: nombre });
    await tarjeta(tres.nombre).scrollIntoViewIfNeeded();
    await expect(tarjeta(tres.nombre)).toContainText('$14.000');
    expect(await fueraDeLaTarjeta(tarjeta(tres.nombre))).toEqual([]);
    const nombre = (await tarjeta(tres.nombre).getByText(tres.nombre).boundingBox())!;
    // El nombre entra en un renglón: los precios no lo aprietan contra el costado.
    expect(nombre.height).toBeLessThan(24);
    const precios = await Promise.all(
      ['$22.000', '$14.000', '$3.500'].map(
        async (texto) =>
          (await tarjeta(tres.nombre).getByText(texto, { exact: true }).boundingBox())!,
      ),
    );
    for (const precio of precios) {
      expect(Math.abs(precio.y - precios[0]!.y)).toBeLessThan(2);
      expect(precio.y).toBeGreaterThan(nombre.y + nombre.height);
    }
    // Con un solo precio sigue al costado del nombre, como siempre.
    const solo = (await tarjeta(uno.nombre).getByText('$3.500', { exact: true }).boundingBox())!;
    const suNombre = (await tarjeta(uno.nombre).getByText(uno.nombre).boundingBox())!;
    expect(solo.x).toBeGreaterThan(suNombre.x + suNombre.width);
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
