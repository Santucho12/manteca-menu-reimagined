import { expect, test, type Locator, type Page } from '@playwright/test';
import { SESIONES } from './ayudas';
import {
  borrarNombresLargos,
  borrarReportesDeMillones,
  borrarTextosLargos,
  MAYO_2015,
  sembrarNombresLargos,
  sembrarReportesDeMillones,
  sembrarTextosLargos,
  TEXTOS_LARGOS,
} from './recortes-de-prueba';

test.use({ storageState: SESIONES.admin });

const DE_MAYO = `desde=${MAYO_2015.desde}&hasta=${MAYO_2015.hasta}`;
const REPORTES = ['ventas', 'productos', 'categorias', 'gastos', 'gastos-por-periodo', 'caja'];

/**
 * Lo que la pantalla no deja leer entero: un texto con puntos suspensivos o tapado por lo que lo
 * contiene, una celda que queda fuera de su tarjeta y un numero del eje fuera de su grafico.
 */
function cortados(page: Page): Promise<string[]> {
  return page.getByRole('main').evaluate((main) => {
    const fuera = (r: DOMRect, c: DOMRect) => r.right > c.right + 1 || r.left < c.left - 1;
    const queRecorta = (e: Element) => {
      for (let a = e.parentElement; a; a = a.parentElement) {
        if (getComputedStyle(a).overflowX !== 'visible') return a;
      }
      return null;
    };
    const lista: string[] = [];
    for (const e of main.querySelectorAll<HTMLElement>('*')) {
      const conTexto = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim());
      if (!conTexto || e.closest('.sr-only, svg')) continue;
      const corta = getComputedStyle(e).overflowX !== 'visible';
      if (corta && e.scrollWidth > e.clientWidth + 1) lista.push(e.textContent!.trim());
    }
    for (const celda of main.querySelectorAll('th, td')) {
      const caja = queRecorta(celda);
      const r = celda.getBoundingClientRect();
      if (caja && fuera(r, caja.getBoundingClientRect())) lista.push(celda.textContent!.trim());
    }
    for (const texto of main.querySelectorAll('svg text')) {
      const dibujo = texto.closest('svg')!.getBoundingClientRect();
      if (fuera(texto.getBoundingClientRect(), dibujo)) lista.push(texto.textContent!.trim());
    }
    return lista;
  });
}

// Cada reporte termina de dibujar su grafico despues de cargar la pagina.
async function verReporte(page: Page, reporte: string) {
  await page.goto(`/admin/reportes/${reporte}?${DE_MAYO}`);
  await expect(page.getByRole('table').first()).toBeVisible();
  await expect(page.locator('figure svg').first()).toBeVisible();
}

async function reportesSinCortes(page: Page) {
  const siembra = await sembrarReportesDeMillones();
  try {
    for (const reporte of REPORTES) {
      await verReporte(page, reporte);
      expect(await cortados(page), reporte).toEqual([]);
    }
  } finally {
    await borrarReportesDeMillones(siembra);
  }
}

const seEncima = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

// El ejemplo de un campo entra si su ancho escrito no pasa del lugar libre del campo.
const ejemploEntero = (campo: Locator) =>
  campo.evaluate((input: HTMLInputElement) => {
    const estilo = getComputedStyle(input);
    const lienzo = document.createElement('canvas').getContext('2d')!;
    lienzo.font = `${estilo.fontWeight} ${estilo.fontSize} ${estilo.fontFamily}`;
    const libre =
      input.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight);
    return lienzo.measureText(input.placeholder).width <= libre;
  });

test.describe('en un celular angosto', () => {
  test.use({ viewport: { width: 360, height: 780 } });
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== 'celular', 'Es el ancho de un celular');
  });

  test('los reportes con montos de millones no cortan columnas, números ni ejes', async ({
    page,
  }) => {
    await reportesSinCortes(page);
  });

  test('Gastos, Proveedores y Usuarios muestran enteros los nombres, los detalles y los emails', async ({
    page,
  }) => {
    const siembra = await sembrarNombresLargos();
    try {
      await page.goto(`/admin/gastos?mes=2026-02&categoria=${siembra.categoria.id}`);
      await expect(page.getByRole('list', { name: 'Gastos' }).getByRole('listitem')).toHaveCount(1);
      expect(await cortados(page), 'gastos').toEqual([]);
      const tarjeta = page
        .getByRole('list', { name: 'Categorías del mes' })
        .getByRole('listitem')
        .filter({ hasText: siembra.categoria.nombre });
      await tarjeta.getByRole('button').click();
      await expect(page.getByRole('dialog', { name: siembra.categoria.nombre })).toBeVisible();
      expect(await cortados(page), 'ventana de la categoría').toEqual([]);
      await page.goto(`/admin/proveedores/${siembra.proveedor.id}`);
      await expect(page.getByRole('list', { name: 'Gastos' }).getByRole('listitem')).toHaveCount(1);
      expect(await cortados(page), 'proveedor').toEqual([]);
    } finally {
      await borrarNombresLargos(siembra);
    }
    await page.goto('/admin/usuarios');
    await expect(
      page.getByRole('list', { name: 'Cuentas' }).getByRole('listitem').first(),
    ).toBeVisible();
    expect(await cortados(page), 'usuarios').toEqual([]);
  });

  test('el ejemplo para sumar un tipo de venta se lee entero, sin el botón encima', async ({
    page,
  }) => {
    await page.goto('/admin/ventas/canales');
    const campo = page.getByLabel('Nombre del tipo de venta nuevo');
    const boton = page.getByRole('button', { name: 'Sumar' });
    expect(seEncima((await campo.boundingBox())!, (await boton.boundingBox())!)).toBe(false);
    expect(await ejemploEntero(campo)).toBe(true);
  });

  test('Inicio, Gastos, Proveedores y Tipos de venta muestran enteros los nombres largos', async ({
    page,
  }) => {
    const siembra = await sembrarTextosLargos();
    const pantallas = [
      ['/admin', TEXTOS_LARGOS.producto],
      ['/admin/gastos', TEXTOS_LARGOS.paraClasificar],
      ['/admin/proveedores', TEXTOS_LARGOS.proveedor],
      ['/admin/ventas/canales', TEXTOS_LARGOS.canal],
    ];
    try {
      for (const [ruta, texto] of pantallas) {
        await page.goto(ruta!);
        await expect(page.getByText(texto!).first()).toBeVisible();
        expect(await cortados(page), ruta).toEqual([]);
      }
    } finally {
      await borrarTextosLargos(siembra);
    }
  });

  test('la ayuda con el título más largo se lee entera', async ({ page }) => {
    await page.goto('/admin/caja/control');
    await page.getByRole('button', { name: 'Cómo funciona esta pantalla' }).click();
    await expect(page.getByRole('dialog')).toContainText('Cómo funciona el control de cierres');
    expect(await cortados(page)).toEqual([]);
  });
});

test.describe('en la computadora', () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== 'computadora', 'Es el ancho de la computadora');
  });

  test('los reportes con montos de millones no cortan los números de los ejes', async ({
    page,
  }) => {
    await reportesSinCortes(page);
  });

  test('el gráfico de Caja muestra cada cierre del período, no solo los diez primeros', async ({
    page,
  }) => {
    const siembra = await sembrarReportesDeMillones();
    try {
      await verReporte(page, 'caja');
      const conCierre = page
        .getByRole('table', { name: 'Cierres por día' })
        .getByRole('row')
        .filter({ hasText: /Sobran|Faltan|Sin diferencia/ });
      await expect(conCierre).toHaveCount(11);
      await expect(page.locator('figure .recharts-bar-rectangle')).toHaveCount(11);
    } finally {
      await borrarReportesDeMillones(siembra);
    }
  });
});
