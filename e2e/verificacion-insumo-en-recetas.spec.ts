// Verificacion funcional, Materia prima, lente 2 (ejecucion): ver docs/verificacion-panel.md.
// La lista dice en cuantas recetas esta un insumo y su ficha, cuales.
import { expect, test } from '@playwright/test';
import { clienteSecretoDePruebas } from '../tests/clientes';
import { SiembraDeCostos } from '../tests/costos-de-prueba';
import { SESIONES } from './ayudas';

test.use({ storageState: SESIONES.admin });

const siembra = new SiembraDeCostos();
test.afterAll(() => siembra.borrar());

test('la lista cuenta las recetas del insumo y la ficha las nombra', async ({ page }) => {
  const { categoria, producto } = await siembra.menu();
  const insumo = await siembra.insumo(1_000);
  const secreto = clienteSecretoDePruebas();
  const { data: receta } = await secreto
    .from('recetas')
    .insert({ local_id: categoria.localId, producto_id: producto.id })
    .select('id')
    .single();
  await secreto.from('renglones_de_receta').insert({
    local_id: categoria.localId,
    receta_id: receta!.id,
    insumo_id: insumo.id,
    cantidad: 35,
  });
  await page.goto(`/admin/materia-prima?q=${encodeURIComponent(insumo.nombre)}`);
  const fila = page.getByRole('listitem').filter({ hasText: insumo.nombre });
  await expect(fila).toContainText('1');
  await page.goto(`/admin/materia-prima/${insumo.id}`);
  const recetas = page.getByRole('list', { name: 'Recetas que lo usan' });
  await expect(recetas.getByRole('link', { name: producto.nombre })).toHaveAttribute(
    'href',
    `/admin/costos/productos/${producto.id}`,
  );
  await expect(page.getByText('Todavía no llegó en ninguna compra.')).toBeVisible();
});
