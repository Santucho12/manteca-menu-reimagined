// Verificacion funcional, Costos, lente 6 (reversa y propagacion): ver
// docs/verificacion-panel.md, hallazgo #9. Sacar el .skip para verificar el fix.
import { expect, test } from '@playwright/test';
import { clienteSecretoDePruebas } from '../tests/clientes';
import { SiembraDeCostos, sembrarUnidades } from '../tests/costos-de-prueba';
import { esperarHidratacion, SESIONES } from './ayudas';

test.use({ storageState: SESIONES.admin });

const siembra = new SiembraDeCostos();
test.afterAll(() => siembra.borrar());

test.skip('#9 · una receta con un insumo desactivado lo muestra marcado y se puede volver a guardar', async ({
  page,
}) => {
  const { categoria, producto } = await siembra.menu();
  const insumo = await siembra.insumo(1_000);
  await sembrarUnidades(categoria, 0, 1);
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
  await clienteSecretoDePruebas().from('insumos').update({ activo: false }).eq('id', insumo.id);
  await page.goto(`/admin/costos/productos/${producto.id}`);
  const elegido = page.getByLabel('Insumo 1', { exact: true });
  await esperarHidratacion(elegido);
  await expect(elegido).toHaveValue(insumo.id);
  await expect(page.getByText(/desactivado/i).first()).toBeVisible();
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Guardamos la receta.')).toBeVisible();
});
