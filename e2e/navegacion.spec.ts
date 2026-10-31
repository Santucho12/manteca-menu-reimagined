import { expect, test, type Page } from '@playwright/test';
import { restaurarTolerancia } from '../tests/cierres-de-prueba';
import { SESIONES, abrirSeccion } from './ayudas';

test.use({ storageState: SESIONES.admin });

// Los pedidos de datos que hace el navegador al cambiar de pantalla, solo los de esa ruta.
function pedidosDe(page: Page, ruta: string): string[] {
  const pedidos: string[] = [];
  page.on('request', (pedido) => {
    const url = new URL(pedido.url());
    const deDatos = url.searchParams.has('_rsc') || pedido.headers()['rsc'] === '1';
    if (deDatos && url.pathname === ruta) pedidos.push(pedido.url());
  });
  return pedidos;
}

async function irA(page: Page, seccion: string, titulo: string) {
  await abrirSeccion(page, seccion);
  await expect(page.getByRole('heading', { name: titulo, level: 1 })).toBeVisible();
}

// Inicio, Caja e Inicio: la segunda vez que se entra a Caja ya estuvo hace segundos.
async function pasarDosVecesPorCaja(page: Page) {
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Inicio', level: 1 })).toBeVisible();
  await irA(page, 'Caja', 'Control de cierres');
  await irA(page, 'Inicio', 'Inicio');
  const pedidos = pedidosDe(page, '/admin/caja/control');
  await irA(page, 'Caja', 'Control de cierres');
  return pedidos;
}

test('volver a una sección recién vista no la vuelve a pedir', async ({ page }) => {
  expect(await pasarDosVecesPorCaja(page)).toEqual([]);
});

test('después de guardar algo, la sección se vuelve a pedir', async ({ page }) => {
  try {
    await pasarDosVecesPorCaja(page);
    await page.getByRole('button', { name: 'Diferencia aceptada' }).click();
    await page.getByLabel('Tolerancia', { exact: true }).fill('750');
    await page.getByRole('button', { name: 'Guardar tolerancia' }).click();
    await expect(page.getByText('Tolerancia guardada.')).toBeVisible();
    // La ventana tapa la barra lateral: se cierra antes de cambiar de sección.
    await page.getByRole('button', { name: 'Cerrar' }).click();
    const pedidos = pedidosDe(page, '/admin');
    await irA(page, 'Inicio', 'Inicio');
    expect(pedidos.length).toBeGreaterThan(0);
  } finally {
    await restaurarTolerancia();
  }
});
