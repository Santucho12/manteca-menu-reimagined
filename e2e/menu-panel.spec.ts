import { expect, test, type Page } from '@playwright/test';
import {
  borrarMenuDePrueba,
  sembrarCategoria,
  sembrarProducto,
  type CategoriaSembrada,
} from '../tests/menu-de-prueba';
import { SESIONES, aviso } from './ayudas';

test.use({ storageState: SESIONES.admin });

let categorias: string[] = [];
test.afterEach(async () => {
  await borrarMenuDePrueba(categorias);
  categorias = [];
});

async function sembrar(...args: Parameters<typeof sembrarCategoria>): Promise<CategoriaSembrada> {
  const categoria = await sembrarCategoria(...args);
  categorias.push(categoria.id);
  return categoria;
}

function tarjeta(page: Page, nombre: string) {
  return page.getByRole('region', { name: nombre });
}

function fila(page: Page, nombre: string) {
  return page.getByRole('listitem').filter({ hasText: nombre });
}

test('el panel avisa de Fudo y muestra los precios con su origen', async ({ page }) => {
  const categoria = await sembrar({ compartidos: [300000] });
  const hereda = await sembrarProducto(categoria, { precios: [null] });
  const propio = await sembrarProducto(categoria, { precios: [350000] });
  await page.goto('/admin/menu');
  await expect(page.getByText('Cambiar un precio acá no lo cambia en Fudo')).toBeVisible();
  await expect(fila(page, hereda.nombre)).toContainText(`Unidad $3.000 (de ${categoria.nombre})`);
  await expect(fila(page, propio.nombre)).toContainText('Unidad $3.500 (propio)');
});

test('ocultar un producto lo saca del menu publico y mostrarlo lo vuelve a poner', async ({
  page,
  browser,
}) => {
  const categoria = await sembrar();
  const producto = await sembrarProducto(categoria);
  await page.goto('/admin/menu');
  await fila(page, producto.nombre)
    .getByRole('button', { name: `Ocultar ${producto.nombre}` })
    .click();
  await expect(fila(page, producto.nombre)).toContainText('Oculto');
  const publico = await browser.newPage({ storageState: { cookies: [], origins: [] } });
  await publico.goto('/');
  await expect(publico.getByText(producto.nombre)).toHaveCount(0);
  await fila(page, producto.nombre)
    .getByRole('button', { name: `Mostrar ${producto.nombre}` })
    .click();
  await expect(fila(page, producto.nombre)).not.toContainText('Oculto');
  await publico.reload();
  await expect(publico.getByText(producto.nombre)).toBeVisible();
  await publico.close();
});

test('no deja mostrar un producto sin precio', async ({ page }) => {
  const categoria = await sembrar();
  const producto = await sembrarProducto(categoria, { visible: false, precios: [null] });
  await page.goto('/admin/menu');
  await fila(page, producto.nombre)
    .getByRole('button', { name: `Mostrar ${producto.nombre}` })
    .click();
  await expect(aviso(page)).toHaveText('Cargale un precio para mostrarlo en el menú.');
});

test('las flechas cambian el orden de los productos', async ({ page }) => {
  const categoria = await sembrar();
  const primero = await sembrarProducto(categoria);
  const segundo = await sembrarProducto(categoria);
  await page.goto('/admin/menu');
  await fila(page, segundo.nombre)
    .getByRole('button', { name: `Subir ${segundo.nombre}` })
    .click();
  await expect(tarjeta(page, categoria.nombre).getByRole('listitem')).toHaveText([
    new RegExp(segundo.nombre),
    new RegExp(primero.nombre),
  ]);
});

test('desactivar pide confirmar, y desde desactivados se reactiva oculto', async ({ page }) => {
  const categoria = await sembrar();
  const producto = await sembrarProducto(categoria);
  await page.goto('/admin/menu');
  await fila(page, producto.nombre)
    .getByRole('button', { name: `Desactivar ${producto.nombre}` })
    .click();
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByText(producto.nombre)).toHaveCount(0);
  await page.getByRole('link', { name: 'Ver desactivados' }).click();
  await fila(page, producto.nombre)
    .getByRole('button', { name: `Reactivar ${producto.nombre}` })
    .click();
  await expect(page.getByText(producto.nombre)).toHaveCount(0);
  await page.goto('/admin/menu');
  await expect(fila(page, producto.nombre)).toContainText('Oculto');
});

test('una categoria con productos no se desactiva y dice cuales', async ({ page }) => {
  const categoria = await sembrar();
  const producto = await sembrarProducto(categoria);
  await page.goto('/admin/menu');
  await tarjeta(page, categoria.nombre)
    .getByRole('button', { name: `Desactivar ${categoria.nombre}` })
    .first()
    .click();
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(aviso(page)).toHaveText(
    `Primero mové o desactivá estos productos: ${producto.nombre}.`,
  );
});

test('guarda una captura del panel del menu', async ({ page }, info) => {
  await page.goto('/admin/menu');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `e2e/capturas/menu-panel-${info.project.name}.png`,
    fullPage: true,
  });
});

for (const rol of ['caja', 'invitado'] as const) {
  test.describe(`con la sesion de ${rol}`, () => {
    test.use({ storageState: SESIONES[rol] });

    test('no entra al menu del panel', async ({ page }) => {
      await page.goto('/admin/menu');
      await expect(page).toHaveURL(/\/admin$/);
    });
  });
}
