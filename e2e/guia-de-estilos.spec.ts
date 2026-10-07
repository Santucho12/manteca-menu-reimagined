import { expect, test, type Locator } from '@playwright/test';

const SECCIONES = ['Colores', 'Tipografías', 'Radios', 'Sombras', 'Espaciados', 'Componentes'];

const COLORES = [
  'Fondo',
  'Texto',
  'Tarjeta',
  'Primario',
  'Secundario',
  'Apagado',
  'Texto apagado',
  'Acento',
  'Destructivo',
  'Borde',
];

function colorDeFondo(elemento: Locator): Promise<string> {
  return elemento.evaluate((nodo) => getComputedStyle(nodo).backgroundColor);
}

test.beforeEach(async ({ page }) => {
  const respuesta = await page.goto('/admin/guia-de-estilos');
  // Sin esto, varias comprobaciones darian verde sobre la pagina de error.
  expect(respuesta?.status()).toBe(200);
});

test('muestra el titulo y todas las secciones', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1, name: 'Guía de estilos' })).toBeVisible();
  for (const seccion of SECCIONES) {
    await expect(page.getByRole('heading', { level: 2, name: seccion })).toBeVisible();
  }
});

test('muestra cada color con su nombre y su variable', async ({ page }) => {
  const colores = page.getByRole('region', { name: 'Colores' });
  for (const color of COLORES) {
    await expect(colores.getByText(color, { exact: true })).toBeVisible();
  }
  await expect(colores.getByText('--accent', { exact: true })).toBeVisible();
});

test('carga las dos tipografias de Manteca', async ({ page }) => {
  const cargadas = await page.evaluate(async () => {
    await document.fonts.ready;
    const cargo = (familia: string) =>
      [...document.fonts].some(
        (fuente) => fuente.family.replace(/["']/g, '') === familia && fuente.status === 'loaded',
      );
    return { manic: cargo('Manic'), neufile: cargo('Neufile Grotesk') };
  });
  expect(cargadas).toEqual({ manic: true, neufile: true });
});

test('la muestra de tipografias trae acentos y eñe', async ({ page }) => {
  const tipografias = page.getByRole('region', { name: 'Tipografías' });
  await expect(
    tipografias.getByText('Cafetería y medialunas de la mañana', { exact: true }).first(),
  ).toBeVisible();
});

test('avisa que Manic no dibuja acentos ni la eñe', async ({ page }) => {
  const tipografias = page.getByRole('region', { name: 'Tipografías' });
  await expect(tipografias.getByText(/Manic no dibuja acentos ni la ñ/)).toBeVisible();
});

test('el titulo usa Manic y el texto usa Neufile Grotesk', async ({ page }) => {
  const titulo = page.getByRole('heading', { level: 1, name: 'Guía de estilos' });
  await expect(titulo).toHaveCSS('font-family', /Manic/);
  await expect(page.locator('body')).toHaveCSS('font-family', /Neufile Grotesk/);
});

test('el fondo de la pagina es el color Fondo de la guia', async ({ page }) => {
  const colores = page.getByRole('region', { name: 'Colores' });
  const fondo = await colorDeFondo(
    colores.getByRole('img', { name: 'Muestra del color Fondo', exact: true }),
  );
  await expect(page.locator('body')).toHaveCSS('background-color', fondo);
});

test('el boton principal usa el color Primario de la guia', async ({ page }) => {
  const colores = page.getByRole('region', { name: 'Colores' });
  const primario = await colorDeFondo(
    colores.getByRole('img', { name: 'Muestra del color Primario', exact: true }),
  );
  const guardar = page.getByRole('region', { name: 'Componentes' }).getByRole('button', {
    name: 'Guardar',
  });
  await expect(guardar).toHaveCSS('background-color', primario);
});

test('muestra los componentes base', async ({ page }) => {
  const componentes = page.getByRole('region', { name: 'Componentes' });
  await expect(componentes.getByRole('button', { name: 'Guardar' })).toBeVisible();
  await expect(componentes.getByRole('button', { name: 'Anular' })).toBeVisible();
  await expect(componentes.getByRole('button', { name: 'No disponible' })).toBeDisabled();
  await expect(componentes.getByLabel('Nombre')).toBeEditable();
  await expect(componentes.getByRole('table')).toBeVisible();
  await expect(
    componentes.getByRole('alert').filter({ hasText: 'Revisá los montos' }),
  ).toBeVisible();
  await expect(componentes.getByText('Más vendido', { exact: true })).toBeVisible();
});

test('muestra un aviso informativo y uno de error', async ({ page }) => {
  const avisos = page.getByRole('region', { name: 'Componentes' }).getByRole('alert');
  await expect(avisos).toHaveCount(2);
  await expect(avisos.filter({ hasText: 'Las ventas están al día' })).toBeVisible();
  await expect(avisos.filter({ hasText: 'No pudimos guardar el cierre' })).toBeVisible();
});

test('muestra los botones en tres tamaños, de menor a mayor', async ({ page }) => {
  const componentes = page.getByRole('region', { name: 'Componentes' });
  const alto = async (nombre: string) => {
    const caja = await componentes.getByRole('button', { name: nombre, exact: true }).boundingBox();
    return caja?.height ?? 0;
  };
  const [chico, normal, grande] = [await alto('Chico'), await alto('Normal'), await alto('Grande')];
  expect(chico).toBeGreaterThan(0);
  expect(chico).toBeLessThan(normal);
  expect(normal).toBeLessThan(grande);
});

test('muestra la plata con el formato del sistema', async ({ page }) => {
  const tabla = page.getByRole('region', { name: 'Componentes' }).getByRole('table');
  await expect(tabla.getByRole('cell', { name: '$1.234,50' })).toBeVisible();
});

test('se puede escribir en el campo de ejemplo', async ({ page }) => {
  const campo = page.getByRole('region', { name: 'Componentes' }).getByLabel('Nombre');
  await campo.fill('Medialuna');
  await expect(campo).toHaveValue('Medialuna');
});

test('no desborda a lo ancho', async ({ page }) => {
  const desborde = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(desborde).toBeLessThanOrEqual(0);
});

test('no la indexan los buscadores', async ({ page }) => {
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test('guarda una captura para revisarla', async ({ page }, info) => {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `e2e/capturas/guia-${info.project.name}.png`, fullPage: true });
});
