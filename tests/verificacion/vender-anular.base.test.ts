// Verificacion funcional, Vender en el mostrador, lente 6 (reversa y propagacion): ver
// docs/verificacion-panel.md. Vende, mide cada numero que usa la venta, la anula y vuelve a
// medir: todos tienen que dejar de contarla.
import { afterAll, describe, expect, it } from 'vitest';
import { borrarCierres, sembrarCierre } from '../cierres-de-prueba';
import { clienteSecretoDePruebas } from '../clientes';
import { SiembraDeCostos, sembrarUnidades } from '../costos-de-prueba';
import { idDelLocalPrincipal } from '../locales';
import { clienteComo } from '../sesiones';
import { borrarVentas } from '../ventas-de-prueba';

const siembra = new SiembraDeCostos();
const ventas: string[] = [];
const cierres: string[] = [];
afterAll(async () => {
  await borrarVentas(ventas);
  await borrarCierres(cierres);
  await siembra.borrar();
});

async function venderEnElMostrador(fecha: string, productoId: string, presentacionId: string) {
  const secreto = clienteSecretoDePruebas();
  const local = await idDelLocalPrincipal(secreto);
  const { data: tipo } = await secreto
    .from('canales_de_venta')
    .select('id')
    .eq('local_id', local)
    .eq('de_sistema', true)
    .single();
  const { data: venta } = await secreto
    .from('ventas')
    .insert({
      local_id: local,
      origen: 'mostrador',
      fecha,
      estado: 'cerrada',
      total_centavos: 200_000,
      canal_id: tipo!.id,
      en_la_caja: true,
      turno: 2,
    })
    .select('id')
    .single();
  ventas.push(venta!.id);
  const fila = { local_id: local, venta_id: venta!.id };
  await secreto.from('renglones_de_venta').insert({
    ...fila,
    producto_id: productoId,
    presentacion_id: presentacionId,
    descripcion: 'Medialuna · Unidad',
    cantidad: 2,
    precio_unitario_centavos: 100_000,
    subtotal_centavos: 200_000,
  });
  await secreto
    .from('pagos_de_venta')
    .insert({ ...fila, medio: 'efectivo', monto_centavos: 200_000 });
  return venta!.id;
}

async function medir(fecha: string, productoId: string, cierreId: string) {
  const admin = await clienteComo('admin');
  const periodo = { desde: fecha, hasta: fecha };
  const [dia, producto, ganancia, totales, cierre] = await Promise.all([
    admin.rpc('reporte_ventas_por_dia', periodo),
    admin.rpc('reporte_ventas_por_producto', periodo),
    admin.rpc('ganancia_por_producto', periodo),
    admin.rpc('ventas_totales', {
      ...periodo,
      el_origen: 'mostrador',
      el_medio: null,
      el_canal: null,
    } as never),
    admin.rpc('cierres_con_resultado', { ...periodo, persona: null } as never),
  ]);
  return {
    porDia: dia.data?.[0]?.monto_centavos ?? 0,
    porProducto: producto.data?.find((f) => f.producto_id === productoId)?.monto_centavos ?? 0,
    ganancia: ganancia.data?.find((f) => f.producto_id === productoId)?.ventas_centavos ?? 0,
    cobrado: totales.data?.[0]?.cobrado_centavos ?? 0,
    esperadoEnEfectivo: cierre.data?.find((c) => c.id === cierreId)?.ventas_efectivo_centavos ?? 0,
  };
}

describe('verificacion · vender en el mostrador · anular', () => {
  it('una venta anulada deja de contar en cada numero que la usaba', async () => {
    const { categoria, producto } = await siembra.menu();
    const insumo = await siembra.insumo(1_000);
    await sembrarUnidades(categoria, 0, 1);
    await (
      await clienteComo('admin')
    ).rpc('recetas_guardar', {
      datos: { producto_id: producto.id, renglones: [{ insumo_id: insumo.id, cantidad: 35 }] },
    });
    const cierre = await sembrarCierre({ turno: 2 } as never);
    cierres.push(cierre.id);
    const venta = await venderEnElMostrador(
      cierre.fecha,
      producto.id,
      categoria.presentaciones[0]!.id,
    );
    const antes = await medir(cierre.fecha, producto.id, cierre.id);
    expect(antes).toMatchObject({ porProducto: 200_000, ganancia: 200_000 });
    expect(antes.esperadoEnEfectivo).toBeGreaterThanOrEqual(200_000);
    const { error } = await (
      await clienteComo('admin')
    )
      .from('ventas')
      .update({ anulado: true, motivo_anulacion: 'Verificacion' })
      .eq('id', venta);
    expect(error).toBeNull();
    const despues = await medir(cierre.fecha, producto.id, cierre.id);
    expect(despues).toEqual({
      porDia: antes.porDia - 200_000,
      porProducto: 0,
      ganancia: 0,
      cobrado: antes.cobrado - 200_000,
      esperadoEnEfectivo: antes.esperadoEnEfectivo - 200_000,
    });
  });
});
