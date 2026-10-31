import { expect, test, type Locator } from '@playwright/test';
import { SESIONES } from './ayudas';

test.use({ storageState: SESIONES.admin });
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== 'celular', 'Estas medidas son las del celular');
});

const anchoDe = async (elemento: Locator) => (await elemento.boundingBox())?.width ?? 0;
const altoDe = async (elemento: Locator) => (await elemento.boundingBox())?.height ?? 0;
const altoSinEscala = (elemento: Locator) =>
  elemento.evaluate((n) => (n as HTMLElement).offsetHeight);

/** Ningun texto se corta: lo que no entra haria que el contenido sea mas ancho que su caja. */
async function sinCortes(textos: Locator) {
  const cortados = await textos.evaluateAll((nodos) =>
    nodos.filter((n) => n.scrollWidth > n.clientWidth + 1).map((n) => n.textContent),
  );
  expect(cortados).toEqual([]);
}

test('Salir se puede tocar con el dedo', async ({ page }) => {
  await page.goto('/admin');
  const salir = page.getByRole('button', { name: 'Salir' }).last();
  // offsetHeight: la barra entra animada y boundingBox mediria la escala del momento.
  expect(await salir.evaluate((n) => (n as HTMLElement).offsetHeight)).toBeGreaterThanOrEqual(44);
});

test('la leyenda de la torta de Inicio muestra los nombres enteros', async ({ page }) => {
  await page.goto('/admin');
  await sinCortes(page.getByRole('list', { name: 'Gastos por categoría' }).locator('li span'));
});

test('los montos de las tarjetas de Gastos entran en la tarjeta', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/admin/gastos');
  const tarjetas = page.locator('button:has(> strong)');
  const montosAnchos = await tarjetas.evaluateAll((nodos) =>
    nodos.filter((n) => {
      const monto = n.querySelector('strong') as HTMLElement;
      const estilo = getComputedStyle(n);
      const lugar =
        n.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight);
      const medida = document.createRange();
      medida.selectNodeContents(monto);
      return medida.getBoundingClientRect().width > lugar;
    }),
  );
  expect(montosAnchos).toHaveLength(0);
});

test('en el menú, el texto del producto usa todo el ancho de la fila', async ({ page }) => {
  await page.goto('/admin/menu');
  const enlace = page.locator('li a[href*="/admin/menu/productos/"]').first();
  const fila = enlace.locator('xpath=ancestor::li[1]');
  expect(await anchoDe(enlace)).toBeGreaterThan((await anchoDe(fila)) * 0.8);
});

test('al cargar una venta, el producto tiene su propio renglón', async ({ page }) => {
  await page.goto('/admin/ventas/nueva');
  const cantidad = page.getByLabel('Cantidad 1');
  const fila = cantidad.locator('..');
  const selector = fila.locator('> div').first();
  expect(await anchoDe(selector)).toBeGreaterThan((await anchoDe(fila)) * 0.9);
});

test('las tarjetas de usuarios no guardan lugar vacío', async ({ page }) => {
  await page.goto('/admin/usuarios');
  const tarjeta = page.getByRole('listitem').filter({ hasText: 'Prueba Admin' }).first();
  expect(await altoDe(tarjeta)).toBeLessThan(170);
});

test('las acciones del menú se tocan sin errarle', async ({ page }) => {
  await page.goto('/admin/menu');
  const accion = page.getByRole('main').locator('li a[aria-label^="Editar"]').first();
  expect(await accion.evaluate((n) => (n as HTMLElement).offsetHeight)).toBeGreaterThanOrEqual(40);
});

test('los atajos de Reportes y la paginación se tocan sin errarle', async ({ page }) => {
  await page.goto('/admin/reportes/ventas');
  const atajo = page.getByRole('link', { name: 'Este mes' });
  expect(await atajo.evaluate((n) => (n as HTMLElement).offsetHeight)).toBeGreaterThanOrEqual(40);
  await page.goto('/admin/ventas');
  const salto = page.getByLabel('Ir a la página');
  expect(await salto.evaluate((n) => (n as HTMLElement).offsetHeight)).toBeGreaterThanOrEqual(40);
});

test('los botones de una ventana mantienen su alto', async ({ page }) => {
  await page.goto('/admin/gastos');
  await page.getByRole('button', { name: 'Marcar como pago' }).first().click();
  const anotar = page.getByRole('button', { name: 'Anotar el pago' });
  const cancelar = page.getByRole('dialog').getByRole('button', { name: 'Cancelar' });
  expect(await altoSinEscala(anotar)).toBeGreaterThanOrEqual(44);
  expect(await altoSinEscala(cancelar)).toBeGreaterThanOrEqual(44);
});

test('en Próximos pagos, la etiqueta de un fijo entra en un renglón', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/admin/gastos');
  const etiqueta = page
    .getByText(/^Fijo · Todos/i)
    .locator('visible=true')
    .first();
  await expect(etiqueta).toBeVisible();
  expect(await altoDe(etiqueta)).toBeLessThan(30);
});

test('las flechas de las formas de venta se tocan sin errarle', async ({ page }) => {
  await page.goto('/admin/menu/categorias/nueva');
  const quitar = page.getByRole('button', { name: 'Quitar la forma de venta 1' });
  expect(await altoSinEscala(quitar)).toBeGreaterThanOrEqual(40);
});

test('los botones de arriba bajan de renglón en vez de cortarse', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/admin/ventas');
  for (const nombre of ['Cargar venta', 'Subir Excel de Fudo', 'Tipos de venta']) {
    const boton = (await page.getByRole('link', { name: nombre }).boundingBox())!;
    expect(boton.x + boton.width).toBeLessThanOrEqual(360);
  }
  await page.goto('/admin/caja/control');
  const diferencia = page.getByRole('button', { name: 'Diferencia aceptada' });
  const caja = (await diferencia.boundingBox())!;
  expect(caja.x + caja.width).toBeLessThanOrEqual(360);
});

test('las etiquetas de las tarjetas de Inicio entran enteras', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/admin');
  await expect(page.getByRole('term').first()).toBeVisible();
  await sinCortes(page.getByRole('term'));
});
