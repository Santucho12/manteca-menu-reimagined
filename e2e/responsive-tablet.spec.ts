import { expect, test, type Locator, type Page } from '@playwright/test';
import { diaEnArgentina } from '../src/lib/fechas';
import { sumarDias } from '../src/lib/reportes/periodos';
import { diaLibre } from '../tests/cierres-de-prueba';
import {
  borrarCategoriasConSusGastos,
  sembrarCategoriaDeGasto,
  sembrarPorPagar,
} from '../tests/gastos-de-prueba';
import { borrarVentas, sembrarVentasParaPaginar } from '../tests/ventas-de-prueba';
import { SESIONES } from './ayudas';

test.use({ storageState: SESIONES.admin });

// Una vez alcanza: cada bloque fija su propio tamaño y su forma de tocar.
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== 'computadora', 'El tamaño lo fija cada bloque');
});

const alto = (elemento: Locator) => elemento.evaluate((n) => (n as HTMLElement).offsetHeight);
const arriba = async (elemento: Locator) => (await elemento.boundingBox())?.y ?? -1;

// El achique del panel y los espacios que lo rodean, como los calcula el navegador.
const medidasDelPanel = (page: Page) =>
  page.evaluate(() => {
    const principal = document.querySelector('main')!;
    return {
      zoom: getComputedStyle(document.documentElement).zoom,
      costado: getComputedStyle(principal).paddingLeft,
      bajoElTitulo: getComputedStyle(principal.querySelector('header')!).marginBottom,
    };
  });

// La lista de ventas con dos páginas, de un día propio: no depende de lo que tenga el mes en curso.
async function verVentasConPaginas(page: Page, mirar: () => Promise<void>) {
  const fecha = diaLibre();
  const ventas = await sembrarVentasParaPaginar(fecha);
  try {
    await page.goto(`/admin/ventas?desde=${fecha}&hasta=${fecha}`);
    await mirar();
  } finally {
    await borrarVentas(ventas);
  }
}

// La pantalla entra animada: se mide hasta que quedó quieta.
async function mismaFila(page: Page, ruta: string, campos: [Locator, Locator][]) {
  await page.goto(ruta);
  for (const [a, b] of campos) {
    await expect(async () => {
      expect(Math.abs((await arriba(a)) - (await arriba(b)))).toBeLessThan(2);
    }).toPass();
  }
}

test.describe('en una tablet, con el dedo', () => {
  test.use({ viewport: { width: 768, height: 1024 }, hasTouch: true, isMobile: true });

  test('conserva el tamaño y los espacios de siempre', async ({ page }) => {
    await page.goto('/admin/ventas');
    expect(await medidasDelPanel(page)).toEqual({
      zoom: '0.95',
      costado: '32px',
      bajoElTitulo: '44px',
    });
  });

  test('la ayuda de cada pantalla se toca sin errarle', async ({ page }) => {
    await page.goto('/admin/gastos');
    const ayuda = page.getByRole('button', { name: 'Cómo funciona esta pantalla' });
    expect(await alto(ayuda)).toBeGreaterThanOrEqual(44);
  });

  test('los atajos de Reportes y la paginación se tocan sin errarle', async ({ page }) => {
    await page.goto('/admin/reportes/ventas');
    expect(await alto(page.getByRole('link', { name: 'Este mes' }))).toBeGreaterThanOrEqual(44);
    await verVentasConPaginas(page, async () => {
      expect(await alto(page.getByRole('link', { name: 'Siguiente' }))).toBeGreaterThanOrEqual(44);
      expect(await alto(page.getByLabel('Ir a la página'))).toBeGreaterThanOrEqual(44);
    });
  });

  test('el mes y el tipo de gasto de Pagados se tocan sin errarle', async ({ page }) => {
    await page.goto('/admin/gastos');
    await page.getByText('Ver los pagados').click();
    expect(await alto(page.getByRole('link', { name: 'Mes anterior' }))).toBeGreaterThanOrEqual(44);
    const fijos = page.getByRole('link', { name: 'Fijos', exact: true });
    expect(await alto(fijos)).toBeGreaterThanOrEqual(44);
  });

  test('el ojo de la contraseña se toca sin errarle', async ({ page }) => {
    await page.goto('/admin/cuenta');
    const ojo = page.getByRole('button', { name: 'Mostrar contraseña actual' });
    expect(await alto(ojo)).toBeGreaterThanOrEqual(44);
  });

  test('las acciones del menú y de las formas de venta se tocan sin errarle', async ({ page }) => {
    await page.goto('/admin/menu');
    const editar = page.getByRole('main').locator('li a[aria-label^="Editar"]').first();
    expect(await alto(editar)).toBeGreaterThanOrEqual(44);
    await page.goto('/admin/menu/categorias/nueva');
    const quitar = page.getByRole('button', { name: 'Quitar la forma de venta 1' });
    expect(await alto(quitar)).toBeGreaterThanOrEqual(44);
  });

  test('las acciones de los tipos de venta se tocan sin errarle', async ({ page }) => {
    await page.goto('/admin/ventas/canales');
    const editar = page.getByRole('link', { name: /^Editar / }).first();
    expect(await alto(editar)).toBeGreaterThanOrEqual(44);
  });

  test('los botones de las tarjetas y los de peligro se tocan sin errarle', async ({ page }) => {
    await page.goto('/admin');
    const anio = page.getByRole('button', { name: 'Ver todo el año' });
    expect(await alto(anio)).toBeGreaterThanOrEqual(44);
    await page.goto('/admin/caja');
    const otraPersona = page.getByRole('button', { name: '¿No sos vos? Cambiar de persona' });
    expect(await alto(otraPersona)).toBeGreaterThanOrEqual(44);
  });

  test('pagar, no pagar y quitar un producto se tocan sin errarle', async ({ page }) => {
    const categoria = await sembrarCategoriaDeGasto();
    try {
      const vencimiento = sumarDias(diaEnArgentina(new Date()), 2);
      await sembrarPorPagar({
        categoriaId: categoria.id,
        descripcion: 'Factura chica',
        vencimiento,
      });
      await page.goto('/admin/gastos');
      const fila = page
        .getByRole('list', { name: 'Próximos pagos' })
        .getByRole('listitem')
        .filter({ hasText: 'Factura chica' });
      const pagar = fila.getByRole('button', { name: 'Marcar como pago' });
      expect(await alto(pagar)).toBeGreaterThanOrEqual(44);
      expect(await alto(fila.getByRole('button', { name: 'No se paga' }))).toBeGreaterThanOrEqual(
        44,
      );
    } finally {
      await borrarCategoriasConSusGastos([categoria.id]);
    }
  });

  test('los botones de encabezado y el Ir se tocan sin errarle', async ({ page }) => {
    await page.goto('/admin/menu');
    expect(await alto(page.getByRole('button', { name: /Nuevo/ }).first())).toBeGreaterThanOrEqual(
      44,
    );
    expect(await alto(page.getByRole('link', { name: 'Aumentar precios' }))).toBeGreaterThanOrEqual(
      44,
    );
    await verVentasConPaginas(page, async () => {
      const ir = page.getByRole('button', { name: 'Ir', exact: true });
      expect(await ir.evaluate((n) => (n as HTMLElement).offsetWidth)).toBeGreaterThanOrEqual(44);
    });
  });

  test('el menú de cada cuenta y Sumar de Tipos de venta se tocan sin errarle', async ({
    page,
  }) => {
    await page.goto('/admin/usuarios');
    const menu = page.getByRole('button', { name: 'Más acciones' }).first();
    expect(await alto(menu)).toBeGreaterThanOrEqual(44);
    expect(await menu.evaluate((n) => (n as HTMLElement).offsetWidth)).toBeGreaterThanOrEqual(44);
    await page.goto('/admin/ventas/canales');
    expect(await alto(page.getByRole('button', { name: 'Sumar' }))).toBeGreaterThanOrEqual(44);
  });

  test('un interruptor responde aunque el dedo caiga apenas afuera', async ({ page }) => {
    await page.goto('/admin/ventas/canales');
    const caja = (await page.getByRole('switch').first().boundingBox())!;
    const tocado = await page.evaluate(
      ([x, y]) => Boolean(document.elementFromPoint(x!, y!)?.closest('[role="switch"]')),
      [caja.x + caja.width / 2, caja.y - 8],
    );
    expect(tocado).toBe(true);
  });

  test('los filtros van de a dos por renglón', async ({ page }) => {
    // Con el tipo de venta (pedido 90), el estado pasa al renglón siguiente.
    await mismaFila(page, '/admin/ventas', [
      [page.getByLabel('Desde'), page.getByLabel('Hasta')],
      [page.getByLabel('Medio de pago'), page.getByLabel('Tipo de venta')],
    ]);
    await mismaFila(page, '/admin/reportes/ventas', [
      [page.getByLabel('Desde', { exact: true }), page.getByLabel('Hasta', { exact: true })],
    ]);
  });

  test('las cuentas van en dos columnas', async ({ page }) => {
    const cuentas = page.getByRole('list', { name: 'Cuentas' }).getByRole('listitem');
    await mismaFila(page, '/admin/usuarios', [[cuentas.nth(0), cuentas.nth(1)]]);
  });
});

test.describe('en la computadora, con mouse', () => {
  test('conserva el tamaño y los espacios de siempre', async ({ page }) => {
    await page.goto('/admin/ventas');
    expect(await medidasDelPanel(page)).toEqual({
      zoom: '0.95',
      costado: '40px',
      bajoElTitulo: '44px',
    });
  });

  test('los atajos de Reportes conservan su tamaño', async ({ page }) => {
    await page.goto('/admin/reportes/ventas');
    expect(await alto(page.getByRole('link', { name: 'Este mes' }))).toBeLessThanOrEqual(36);
  });

  test('Hoy y Ayer tienen el alto del campo de fecha', async ({ page }) => {
    await page.goto('/admin/gastos/nuevo');
    const hoy = page.getByRole('button', { name: 'Hoy', exact: true });
    const fecha = page.getByLabel('Fecha de pago');
    expect(await alto(hoy)).toBe(await alto(fecha));
  });

  test('los filtros siguen en un solo renglón', async ({ page }) => {
    await mismaFila(page, '/admin/ventas', [[page.getByLabel('Desde'), page.getByLabel('Estado')]]);
  });
});
