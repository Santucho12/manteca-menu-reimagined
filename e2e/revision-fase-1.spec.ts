import { expect, test, type Page } from '@playwright/test';
import { borrarCierres, sembrarCierre } from '../tests/cierres-de-prueba';
import { clienteSecretoDePruebas } from '../tests/clientes';
import { borrarCategoriasConSusGastos, sembrarCategoriaDeGasto } from '../tests/gastos-de-prueba';
import { SESIONES, esperarHidratacion } from './ayudas';

test.use({ storageState: SESIONES.admin });

let cierres: string[] = [];

// Dos dias seguidos que no usa otro test: ayer quedaron $15.000 y hoy se arranco con $10.000.
test.beforeAll(async () => {
  const ayer = await sembrarCierre({ fecha: '1997-05-10', quedaEnCajaCentavos: 1500000 });
  const hoy = await sembrarCierre({ fecha: '1997-05-11' });
  cierres = [ayer.id, hoy.id];
  const { data } = await clienteSecretoDePruebas()
    .from('cierres_de_caja')
    .select('local_id')
    .eq('id', hoy.id)
    .single();
  await clienteSecretoDePruebas().from('retiros_de_caja').insert({
    local_id: data!.local_id,
    cierre_id: hoy.id,
    monto_centavos: 500000,
    quien: 'Dueño',
  });
});

test.afterAll(async () => {
  await borrarCierres(cierres);
});

test('el control marca el fondo distinto y muestra lo retirado', async ({ page }) => {
  await page.goto('/admin/caja/control?desde=1997-05-10&hasta=1997-05-11');
  const lista = page.getByRole('list', { name: 'Cierres' });
  const deHoy = lista.getByRole('listitem').filter({ hasText: '11/05/1997' });
  await expect(deHoy).toContainText('Fondo distinto');
  await expect(deHoy).toContainText('Retiros: $5.000,00');
  const deAyer = lista.getByRole('listitem').filter({ hasText: '10/05/1997' });
  await expect(deAyer).not.toContainText('Fondo distinto');
  const enlace = deHoy.getByRole('link', { name: '11/05/1997' });
  await esperarHidratacion(enlace);
  await enlace.click();
  await expect(
    page.getByText('Arrancó con $5.000,00 menos de lo que quedó en el cierre anterior.'),
  ).toBeVisible();
});

test.describe('cargar dos gastos seguidos volviendo atras', () => {
  let categoria: { id: string; nombre: string };
  test.beforeAll(async () => {
    categoria = await sembrarCategoriaDeGasto();
  });
  test.afterAll(async () => {
    await borrarCategoriasConSusGastos([categoria.id]);
  });

  async function cargar(page: Page, descripcion: string) {
    await esperarHidratacion(page.getByLabel('Categoría'));
    await page.getByLabel('Categoría').selectOption({ label: categoria.nombre });
    await page.getByLabel('Monto').fill('100');
    await page.getByLabel('Descripción').fill(descripcion);
    await page.getByLabel('Medio de pago').selectOption({ label: 'Transferencia' });
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Gastos' })).toBeVisible();
  }

  test('guarda los dos: el formulario de vuelta no reusa la clave', async ({ page }) => {
    await page.goto('/admin/gastos/nuevo');
    await cargar(page, 'Primero');
    await page.goBack();
    await expect(page.getByRole('heading', { level: 1, name: 'Cargar gasto' })).toBeVisible();
    await cargar(page, 'Segundo');
    const { data } = await clienteSecretoDePruebas()
      .from('gastos')
      .select('descripcion')
      .eq('categoria_id', categoria.id);
    expect((data ?? []).map((g) => g.descripcion).sort()).toEqual(['Primero', 'Segundo']);
  });
});

test('cargar gasto no ofrece el efectivo de la caja', async ({ page }) => {
  await page.goto('/admin/gastos/nuevo');
  const medio = page.getByLabel('Medio de pago');
  await expect(medio.locator('option', { hasText: 'Transferencia' })).toHaveCount(1);
  await expect(medio.locator('option', { hasText: 'Efectivo de la caja' })).toHaveCount(0);
});
