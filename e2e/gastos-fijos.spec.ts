import { expect, test, type Page } from '@playwright/test';
import { diaEnArgentina } from '../src/lib/fechas';
import { fechaParaMostrar } from '../src/lib/gastos/pantalla';
import { sumarMeses } from '../src/lib/gastos/vencimientos';
import {
  borrarCategoriasConSusGastos,
  pagarLoDelFijo,
  sembrarCategoriaDeGasto,
  sembrarRecurrente,
} from '../tests/gastos-de-prueba';
import { SESIONES } from './ayudas';

test.use({ storageState: SESIONES.admin });

const HOY = diaEnArgentina(new Date());
let categorias: string[] = [];
test.afterEach(async () => {
  await borrarCategoriasConSusGastos(categorias);
  categorias = [];
});

async function fijo(primerVencimiento: string) {
  const categoria = await sembrarCategoriaDeGasto();
  categorias.push(categoria.id);
  const { id } = await sembrarRecurrente({ categoria: categoria.nombre, primerVencimiento });
  return { id, nombre: categoria.nombre };
}

const fila = (page: Page, lista: string, texto: string) =>
  page.getByRole('list', { name: lista }).getByRole('listitem').filter({ hasText: texto });

async function guardar(page: Page) {
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Gastos' })).toBeVisible();
}

test('cambiar el monto vale para los próximos; lo ya pagado queda', async ({ page }) => {
  const { id, nombre } = await fijo(HOY);
  // Al abrir, lo de hoy queda por pagar; pagado, aparece en los pagos del fijo.
  await page.goto('/admin/gastos');
  await pagarLoDelFijo(id, HOY);
  await page.goto(`/admin/gastos/fijos/${id}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Gasto fijo' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Pagos' }).getByRole('listitem')).toHaveCount(1);
  await page.getByLabel('Monto').fill('600.000');
  await guardar(page);
  await expect(fila(page, 'Próximos pagos', nombre)).toContainText('$600.000,00');
  await expect(fila(page, 'Gastos', nombre)).toContainText('$500.000,00');
});

test('el próximo pago se cambia con el calendario', async ({ page }) => {
  const { id } = await fijo(sumarMeses(HOY, 1));
  const nuevo = `${sumarMeses(HOY, 2).slice(0, 8)}15`;
  await page.goto(`/admin/gastos/fijos/${id}`);
  await expect(page.getByLabel('Próximo pago')).toHaveText(fechaParaMostrar(sumarMeses(HOY, 1)));
  await page.getByLabel('Próximo pago').click();
  await page.getByRole('button', { name: 'Mes siguiente' }).click();
  await page.getByRole('button', { name: fechaParaMostrar(nuevo) }).click();
  await guardar(page);
  await page.goto(`/admin/gastos/fijos/${id}`);
  await expect(page.getByLabel('Próximo pago')).toHaveText(fechaParaMostrar(nuevo));
});

test('se pausa y se reactiva', async ({ page }) => {
  const { id } = await fijo(sumarMeses(HOY, 1));
  await page.goto(`/admin/gastos/fijos/${id}`);
  await page.getByRole('button', { name: 'Pausar' }).click();
  await expect(page.getByText('Pausado', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reactivar' }).click();
  await expect(page.getByRole('button', { name: 'Pausar' })).toBeVisible();
});

test('guarda la captura del gasto fijo', async ({ page }, info) => {
  const { id } = await fijo(HOY);
  await page.goto('/admin/gastos');
  await page.goto(`/admin/gastos/fijos/${id}`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `e2e/capturas/gasto-fijo-${info.project.name}.png`,
    fullPage: true,
  });
});

for (const rol of ['caja', 'invitado'] as const) {
  test.describe(`con la sesion de ${rol}`, () => {
    test.use({ storageState: SESIONES[rol] });

    test('no entra a un gasto fijo', async ({ page }) => {
      await page.goto('/admin/gastos/fijos/00000000-0000-0000-0000-000000000000');
      await expect(page).toHaveURL(/\/admin$/);
    });
  });
}
