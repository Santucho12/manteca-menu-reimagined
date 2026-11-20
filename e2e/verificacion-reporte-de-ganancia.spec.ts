// Verificacion funcional, Reportes, lente 2 (ejecucion): ver docs/verificacion-panel.md.
// El reporte Ganancia por producto abre y muestra lo vendido de un producto con su ganancia.
import { expect, test } from '@playwright/test';
import { clienteSecretoDePruebas } from '../tests/clientes';
import { SiembraDeCostos } from '../tests/costos-de-prueba';
import { idDelLocalPrincipal } from '../tests/locales';
import { SESIONES } from './ayudas';

test.use({ storageState: SESIONES.admin });

const siembra = new SiembraDeCostos();
const ventas: string[] = [];
test.afterAll(async () => {
  const secreto = clienteSecretoDePruebas();
  await secreto.from('renglones_de_venta').delete().in('venta_id', ventas);
  await secreto.from('ventas').delete().in('id', ventas);
  await secreto.from('auditoria').delete().in('registro_id', ventas);
  await siembra.borrar();
});

test('el reporte muestra lo vendido de un producto con su costo y su ganancia', async ({
  page,
}) => {
  const { categoria, producto } = await siembra.menu();
  const secreto = clienteSecretoDePruebas();
  const local = await idDelLocalPrincipal(secreto);
  const fecha = '2026-02-10';
  const { data: venta } = await secreto
    .from('ventas')
    .insert({
      local_id: local,
      origen: 'manual',
      fecha,
      estado: 'cerrada',
      total_centavos: 200_000,
    })
    .select('id')
    .single();
  ventas.push(venta!.id);
  await secreto.from('renglones_de_venta').insert({
    local_id: local,
    venta_id: venta!.id,
    producto_id: producto.id,
    presentacion_id: categoria.presentaciones[0]!.id,
    descripcion: producto.nombre,
    cantidad: 2,
    precio_unitario_centavos: 100_000,
    subtotal_centavos: 200_000,
    costo_unitario_centavos: 35_000,
  });
  await page.goto(`/admin/reportes/ganancia?desde=${fecha}&hasta=${fecha}`);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Ganancia por producto' }),
  ).toBeVisible();
  const fila = page
    .getByRole('list', { name: 'Ganancia por producto' })
    .getByRole('listitem')
    .filter({ hasText: producto.nombre });
  await expect(fila).toContainText('$1.300,00');
  await expect(fila).toContainText('65 %');
});
