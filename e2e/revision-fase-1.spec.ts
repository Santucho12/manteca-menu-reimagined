import { expect, test } from '@playwright/test';
import { borrarCierres, sembrarCierre } from '../tests/cierres-de-prueba';
import { clienteSecretoDePruebas } from '../tests/clientes';
import { SESIONES } from './ayudas';

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
  await deHoy.getByRole('link', { name: '11/05/1997' }).click();
  await expect(
    page.getByText('Arrancó con $5.000,00 menos de lo que quedó en el cierre anterior.'),
  ).toBeVisible();
});

test('cargar gasto no ofrece el efectivo de la caja', async ({ page }) => {
  await page.goto('/admin/gastos/nuevo');
  const medio = page.getByLabel('Medio de pago');
  await expect(medio.locator('option', { hasText: 'Transferencia' })).toHaveCount(1);
  await expect(medio.locator('option', { hasText: 'Efectivo de la caja' })).toHaveCount(0);
});
