import { expect, test } from '@playwright/test';
import { diaEnArgentina } from '../src/lib/fechas';
import { sumarMeses } from '../src/lib/gastos/vencimientos';
import { sumarDias } from '../src/lib/reportes/periodos';
import { borrarCierres, sembrarCierreConSalidas } from '../tests/cierres-de-prueba';
import {
  borrarCategoriasConSusGastos,
  borrarGastos,
  sembrarCategoriaDeGasto,
  sembrarGasto,
  sembrarRecurrente,
} from '../tests/gastos-de-prueba';
import { sembrarVentaConRenglones } from '../tests/reportes-de-prueba';
import { borrarVentas, productoParaVender, type ParaVender } from '../tests/ventas-de-prueba';
import { SESIONES } from './ayudas';

test.use({ storageState: SESIONES.admin });

const HOY = diaEnArgentina(new Date());
// Antes que cualquier dia que use otro test: es el gasto sin clasificar mas viejo.
const DIA_DEL_GASTO = '2000-06-15';
let cierre: string;
let producto: ParaVender;
let venta: string;
let ventaDeAyer: string;
let recurrente: string;
// El primer día del mes anterior cae siempre dentro de lo que se compara con el mes en curso.
const PRIMERO_DEL_MES_ANTERIOR = sumarMeses(`${HOY.slice(0, 8)}01`, -1);
const otrosProductos: ParaVender[] = [];
const otrasVentas: string[] = [];
let categoriaDeGasto: string | undefined;

// Lo que el mes necesita aunque la base no tenga nada del mes en curso (el día 1, por ejemplo):
// gastos de hoy y del mes anterior, una venta del mes anterior y cuatro productos para las medallas.
async function sembrarElMes() {
  categoriaDeGasto = (await sembrarCategoriaDeGasto()).id;
  await sembrarGasto({ categoriaId: categoriaDeGasto, fecha: HOY, montoCentavos: 1_500_000 });
  const anterior = { categoriaId: categoriaDeGasto, fecha: PRIMERO_DEL_MES_ANTERIOR };
  await sembrarGasto({ ...anterior, montoCentavos: 1_000_000 });
  for (const precioCentavos of [5_000_000, 4_000_000, 3_000_000]) {
    const otro = await productoParaVender();
    otrosProductos.push(otro);
    const renglones = [{ producto: otro, cantidad: 1, precioCentavos }];
    otrasVentas.push(await sembrarVentaConRenglones({ fecha: HOY, renglones }));
  }
  const delMesAnterior = [{ producto, cantidad: 1, precioCentavos: 1_000_000 }];
  otrasVentas.push(
    await sembrarVentaConRenglones({ fecha: PRIMERO_DEL_MES_ANTERIOR, renglones: delMesAnterior }),
  );
}

test.beforeAll(async () => {
  // El cierre deja un gasto de caja en "Sin clasificar": el aviso tiene que aparecer.
  cierre = await sembrarCierreConSalidas(DIA_DEL_GASTO);
  producto = await productoParaVender();
  // Un monto de 8 cifras: queda primero entre los mas vendidos y prueba que entra en el celular.
  venta = await sembrarVentaConRenglones({
    fecha: HOY,
    renglones: [{ producto, cantidad: 3, precioCentavos: 999_999_900 }],
  });
  ventaDeAyer = await sembrarVentaConRenglones({
    fecha: sumarDias(HOY, -1),
    renglones: [{ producto, cantidad: 1, precioCentavos: 1_234_500 }],
  });
  // Vence pasado mañana: el proceso de los recurrentes todavia no lo genera.
  recurrente = (
    await sembrarRecurrente({ primerVencimiento: sumarDias(HOY, 2), montoCentavos: 432_100 })
  ).id;
  await sembrarElMes();
});

// Si la siembra se cortó a mitad, se borra lo que alcanzó a crear.
test.afterAll(async () => {
  if (recurrente) await borrarGastos({ recurrentes: [recurrente] });
  const productos = [producto, ...otrosProductos].filter(Boolean);
  await borrarVentas([venta, ventaDeAyer, ...otrasVentas].filter(Boolean), {
    categoriasDelMenu: productos.map((p) => p.categoriaId),
  });
  if (categoriaDeGasto) await borrarCategoriasConSusGastos([categoriaDeGasto]);
  if (cierre) await borrarCierres([cierre]);
});

const grafico = (page: import('@playwright/test').Page) =>
  page.getByRole('figure', { name: 'Gráfico por mes' }).locator('svg').first();

const colorDeLaSerie = (page: import('@playwright/test').Page, figura: string, serie: string) =>
  page
    .getByRole('figure', { name: figura })
    .locator('.recharts-legend-item')
    .filter({ hasText: serie })
    .locator('path')
    .first();

test('el subtítulo de Inicio invita a empezar el día', async ({ page }) => {
  await page.goto('/admin');
  await expect(
    page.getByText('Cómo viene el mes y qué hay que saber para comenzar el día.'),
  ).toBeVisible();
});

test('los números no abren carteles: se explican en el cómo funciona', async ({ page }) => {
  await page.goto('/admin');
  const tarjeta = page.getByRole('term').filter({ hasText: 'Balance' }).locator('xpath=../../..');
  await tarjeta.getByRole('definition').hover();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await page.getByRole('button', { name: 'Cómo funciona esta pantalla' }).first().click();
  await expect(page.getByText(/las ventas menos los gastos/)).toBeVisible();
});

test('la torta de gastos tiene un botón que lleva a Gastos', async ({ page }) => {
  await page.goto('/admin');
  const torta = page.getByRole('region', { name: 'Gastos del mes' });
  await torta.getByRole('link', { name: /Ver gastos/ }).click();
  await expect(page).toHaveURL(/\/admin\/gastos$/);
});

test('más vendidos tiene un botón Ver costos, que abre Costos', async ({ page }) => {
  await page.goto('/admin');
  const lista = page.getByRole('region', { name: 'Más vendidos' });
  await lista.getByRole('link', { name: /Ver costos/ }).click();
  await expect(page).toHaveURL(/\/admin\/costos$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Costos' })).toBeVisible();
});

// Abre el detalle de su gráfico, el reporte de ventas, como antes del pedido 48.
test('la semana tiene un botón que abre el reporte de ventas', async ({ page }) => {
  await page.goto('/admin');
  const semana = page.getByRole('region', { name: 'Esta semana vs la anterior' });
  await semana.getByRole('link', { name: /Ver reportes/ }).click();
  await expect(page).toHaveURL(/\/admin\/reportes\/ventas$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Ventas por período' })).toBeVisible();
});

test('el mes a mes marca el mes de hoy como en curso', async ({ page }) => {
  await page.goto('/admin');
  const grafico = page.getByRole('figure', { name: 'Gráfico por mes' });
  await expect(grafico.getByText('en curso')).toHaveCount(1);
});

test('cada tarjeta explica en una línea qué muestra', async ({ page }) => {
  await page.goto('/admin');
  const descripciones = [
    ['Mes a mes', 'Ventas, gastos y balance de cada mes.'],
    ['Esta semana vs la anterior', 'Lo vendido sumado día a día, contra la semana pasada.'],
    ['Gastos del mes', 'En qué se fue la plata del mes.'],
    ['Más vendidos', 'Por lo que dejaron en el mes, no por unidades.'],
  ] as const;
  for (const [tarjeta, descripcion] of descripciones) {
    await expect(page.getByRole('region', { name: tarjeta })).toContainText(descripcion);
  }
});

test('más vendidos aclara que se ordena por plata', async ({ page }) => {
  await page.goto('/admin');
  const lista = page.getByRole('region', { name: 'Más vendidos' });
  await expect(lista).toContainText('Por lo que dejaron en el mes, no por unidades.');
});

test('los avisos van en una tarjeta blanca', async ({ page }) => {
  await page.goto('/admin');
  const avisos = page.getByRole('region', { name: /Para atender/ });
  await expect(avisos).toHaveCSS('background-color', 'rgb(255, 255, 255)');
});

test('las leyendas de los gráficos llevan círculos', async ({ page }) => {
  await page.goto('/admin');
  for (const figura of ['Gráfico por mes', 'Ventas por día']) {
    const iconos = page.getByRole('figure', { name: figura }).locator('.recharts-legend-item path');
    await expect(iconos.first()).toHaveAttribute('d', /a/i);
    await expect(iconos.first()).not.toHaveAttribute('d', /h-?\d+v-?\d+h/);
  }
});

test('los gráficos van en azul, verde y rojo', async ({ page }) => {
  await page.goto('/admin');
  const esperados = [
    ['Gráfico por mes', 'Ventas', 'fill', '#10b981'],
    ['Gráfico por mes', 'Balance', 'fill', '#2563eb'],
    ['Gráfico por mes', 'Gastos', 'fill', '#f43f5e'],
    ['Ventas por día', 'Esta semana', 'fill', '#2563eb'],
    ['Ventas por día', 'Semana anterior', 'fill', '#f43f5e'],
  ] as const;
  for (const [figura, serie, atributo, color] of esperados) {
    await expect(colorDeLaSerie(page, figura, serie)).toHaveAttribute(atributo, color);
  }
});

test('la semana dice si vas arriba o abajo de la anterior, con un acumulado', async ({ page }) => {
  await page.goto('/admin');
  const semana = page.getByRole('region', { name: 'Esta semana vs la anterior' });
  await expect(semana.getByRole('heading', { name: /^Vas / })).toBeVisible();
  await expect(semana.getByText(/^[▲▼=] \$.+ vs \$.+$/)).toBeVisible();
  await expect(semana.locator('.recharts-line').first()).toBeVisible();
  await expect(semana.locator('.recharts-bar-rectangle')).toHaveCount(0);
});

test('la variación de cada tarjeta va en verde si mejora y en rojo si empeora', async ({
  page,
}) => {
  await page.goto('/admin');
  const verde = 'rgb(5, 150, 105)';
  const rojo = 'rgb(225, 29, 72)';
  for (const etiqueta of ['Ventas', 'Gastos', 'Balance', 'Ticket promedio']) {
    const tarjeta = page.getByRole('term').filter({ hasText: etiqueta }).locator('xpath=../../..');
    const variacion = tarjeta.getByText(/^[+-]\$/);
    const subio = (await variacion.textContent())!.startsWith('+');
    const bueno = etiqueta === 'Gastos' ? !subio : subio;
    await expect(variacion).toHaveCSS('color', bueno ? verde : rojo);
    await expect(tarjeta.getByTestId(subio ? 'flecha-sube' : 'flecha-baja')).toBeVisible();
  }
});

test('los gastos del mes se ven en una torta, a la par de la semana', async ({ page }, info) => {
  await page.goto('/admin');
  const torta = page.getByRole('figure', { name: 'Gastos por categoría' });
  await expect(torta).toBeVisible();
  await expect(torta.locator('.recharts-sector').first()).toBeVisible();
  const lista = page.getByRole('list', { name: 'Gastos por categoría' });
  await expect(lista.getByRole('listitem').first()).toContainText('%');
  // En el celular van una debajo de la otra.
  if (info.project.name !== 'computadora') return;
  const semana = await page
    .getByRole('region', { name: 'Esta semana vs la anterior' })
    .boundingBox();
  const gastos = await page.getByRole('region', { name: 'Gastos del mes' }).boundingBox();
  expect(Math.abs(semana!.y - gastos!.y)).toBeLessThan(2);
});

test('la tarjeta de Balance va en azul', async ({ page }) => {
  await page.goto('/admin');
  const tarjeta = page.getByRole('term').filter({ hasText: 'Balance' }).locator('xpath=../..');
  await expect(tarjeta.locator('svg').first()).toHaveCSS('color', 'rgb(37, 99, 235)');
});

test('los tres más vendidos llevan medalla de oro, plata y bronce', async ({ page }) => {
  await page.goto('/admin');
  const filas = page.getByRole('list', { name: 'Más vendidos' }).getByRole('listitem');
  const medallas = ['Medalla de oro', 'Medalla de plata', 'Medalla de bronce'];
  for (const [posicion, medalla] of medallas.entries()) {
    await expect(filas.nth(posicion).getByRole('img', { name: medalla })).toBeVisible();
  }
  await expect(filas.nth(3).getByRole('img', { name: /Medalla/ })).toHaveCount(0);
});

test('ve el aviso de gastos sin clasificar y lo lleva a gastos', async ({ page }) => {
  await page.goto('/admin');
  const aviso = page.getByRole('link', { name: /gastos? sin clasificar/ });
  await expect(aviso).toBeVisible();
  await aviso.click();
  await expect(page).toHaveURL(/\/admin\/gastos$/);
  // Para clasificar muestra los de cualquier mes: el gasto sembrado se ve aunque sea viejo.
  const paraClasificar = page.getByRole('list', { name: 'Para clasificar' });
  await expect(paraClasificar.getByText('15/06/2000').first()).toBeVisible();
  await expect(paraClasificar.getByText('Hielo').first()).toBeVisible();
});

test('un monto de 8 cifras entra en su tarjeta, sin desbordar la pantalla', async ({ page }) => {
  await page.goto('/admin');
  const valores = page.getByRole('definition');
  // El total del mes depende de lo que haya en la base: la venta sembrada se ve entre los mas vendidos.
  // La de ayer es del mismo producto: se suma, salvo el dia 1, cuando ayer es del mes anterior.
  await expect(page.getByRole('list', { name: 'Más vendidos' })).toContainText(
    /\$(29\.999\.997|30\.012\.342),00/,
  );
  const desbordados = await valores.evaluateAll(
    (todos) => todos.filter((v) => v.scrollWidth > v.clientWidth).length,
  );
  expect(desbordados).toBe(0);
  const sobrante = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(sobrante).toBeLessThanOrEqual(0);
});

test('ve los numeros del mes y el producto que mas vendio', async ({ page }) => {
  await page.goto('/admin');
  for (const etiqueta of ['Ventas', 'Gastos', 'Balance', 'Ticket promedio']) {
    await expect(page.getByRole('term').filter({ hasText: etiqueta })).toBeVisible();
  }
  const lista = page.getByRole('list', { name: 'Más vendidos' });
  await expect(lista.getByRole('listitem').first()).toContainText(producto.texto.split(' · ')[0]!);
  await expect(grafico(page)).toBeVisible();
});

test('el bloque de ventas del mes muestra el monto y cuantas ventas van', async ({ page }) => {
  await page.goto('/admin');
  const bloque = page.getByRole('region', { name: 'Ventas del mes' });
  await expect(bloque).toContainText(/Del 1 a hoy · \d+ ventas?/);
  await expect(bloque).toContainText(/\$[\d.]{9,},\d{2}/);
  await expect(bloque).toContainText('Gastos');
  await expect(bloque).toContainText('Balance');
});

test('el mes a mes arranca con 4 meses y se amplia a todo el año', async ({ page }) => {
  await page.goto('/admin');
  const barras = page.locator('[aria-label="Gráfico por mes"] .recharts-bar-rectangle');
  await expect(barras).toHaveCount(12); // 4 meses x 3 series
  await page.getByRole('button', { name: 'Ver todo el año' }).click();
  await expect(page.getByRole('button', { name: 'Ver 4 meses' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(await barras.count()).toBeGreaterThan(12);
});

test('abajo de todo, las ventas de los ultimos 7 dias contra los 7 anteriores', async ({
  page,
}) => {
  await page.goto('/admin');
  const panel = page.getByRole('region', { name: 'Esta semana vs la anterior' });
  await expect(panel.getByRole('figure', { name: 'Ventas por día' })).toBeVisible();
  await expect(
    panel.getByText('Esta semana vs la anterior', { exact: true }).first(),
  ).toBeVisible();
  await expect(panel.getByText('Semana anterior')).toBeVisible();
});

test('guarda capturas del inicio', async ({ page }, info) => {
  await page.goto('/admin');
  await expect(grafico(page)).toBeVisible();
  await page.screenshot({
    path: `e2e/capturas/inicio-admin-${info.project.name}.png`,
    fullPage: true,
  });
});
