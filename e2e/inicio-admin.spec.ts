import { expect, test } from '@playwright/test';
import { diaEnArgentina } from '../src/lib/fechas';
import { borrarCierres, diaLibre, sembrarCierreConSalidas } from '../tests/cierres-de-prueba';
import { sembrarVentaConRenglones } from '../tests/reportes-de-prueba';
import { borrarVentas, productoParaVender, type ParaVender } from '../tests/ventas-de-prueba';
import { SESIONES } from './ayudas';

test.use({ storageState: SESIONES.admin });

const HOY = diaEnArgentina(new Date());
let cierre: string;
let producto: ParaVender;
let venta: string;

test.beforeAll(async () => {
  // El cierre deja un gasto de caja en "Sin clasificar": el aviso tiene que aparecer.
  cierre = await sembrarCierreConSalidas(diaLibre());
  producto = await productoParaVender();
  // Un monto enorme: queda primero entre los mas vendidos del mes.
  venta = await sembrarVentaConRenglones({
    fecha: HOY,
    renglones: [{ producto, cantidad: 3, precioCentavos: 9_999_900 }],
  });
});

test.afterAll(async () => {
  await borrarVentas([venta], { categoriasDelMenu: [producto.categoriaId] });
  await borrarCierres([cierre]);
});

const grafico = (page: import('@playwright/test').Page) =>
  page.getByRole('figure', { name: 'Gráfico por mes' }).locator('svg').first();

test('ve el aviso de gastos sin clasificar y lo lleva a gastos', async ({ page }) => {
  await page.goto('/admin');
  const aviso = page.getByRole('link', { name: /gastos? sin clasificar/ });
  await expect(aviso).toBeVisible();
  await aviso.click();
  await expect(page).toHaveURL(/\/admin\/gastos\?categoria=.+&desde=/);
});

test('ve los numeros del mes y el producto que mas vendio', async ({ page }) => {
  await page.goto('/admin');
  for (const etiqueta of ['Ventas', 'Gastos', 'Resultado', 'Ticket promedio']) {
    await expect(page.getByRole('term').filter({ hasText: etiqueta })).toBeVisible();
  }
  const lista = page.getByRole('list', { name: 'Más vendidos' });
  await expect(lista.getByRole('listitem').first()).toContainText(producto.texto.split(' · ')[0]!);
  await expect(grafico(page)).toBeVisible();
});

test('guarda capturas del inicio', async ({ page }, info) => {
  await page.goto('/admin');
  await expect(grafico(page)).toBeVisible();
  await page.screenshot({
    path: `e2e/capturas/inicio-admin-${info.project.name}.png`,
    fullPage: true,
  });
});
