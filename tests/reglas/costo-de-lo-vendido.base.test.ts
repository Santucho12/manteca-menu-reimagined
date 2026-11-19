import { afterAll, describe, expect, it } from 'vitest';
import { clienteSecretoDePruebas } from '../clientes';
import { SiembraDeCostos, sembrarUnidades } from '../costos-de-prueba';
import { clienteComo } from '../sesiones';
import { borrarVentas, sembrarVenta } from '../ventas-de-prueba';

const siembra = new SiembraDeCostos();
const ventas: string[] = [];
afterAll(async () => {
  await borrarVentas(ventas);
  await siembra.borrar();
});

const FECHA = '2026-03-03';

// Un producto con costo $350 la unidad y precio $1.000.
async function productoConCosto() {
  const { categoria, producto } = await siembra.menu();
  const insumo = await siembra.insumo(1_000);
  await sembrarUnidades(categoria, 0, 1);
  const { error } = await (
    await clienteComo('admin')
  ).rpc('recetas_guardar', {
    datos: { producto_id: producto.id, renglones: [{ insumo_id: insumo.id, cantidad: 35 }] },
  });
  if (error) throw new Error(error.message);
  return {
    producto,
    unidad: categoria.presentaciones[0]!.id,
    docena: categoria.presentaciones[1]!.id,
  };
}

async function vender(productoId: string, presentacionId: string, cantidad: number, fecha = FECHA) {
  const { id } = await sembrarVenta({ fecha });
  ventas.push(id);
  const secreto = clienteSecretoDePruebas();
  const { data: venta } = await secreto.from('ventas').select('local_id').eq('id', id).single();
  const { data, error } = await secreto
    .from('renglones_de_venta')
    .insert({
      local_id: venta!.local_id,
      venta_id: id,
      producto_id: productoId,
      presentacion_id: presentacionId,
      descripcion: 'Medialuna',
      cantidad,
      precio_unitario_centavos: 100_000,
      subtotal_centavos: cantidad * 100_000,
    })
    .select('costo_unitario_centavos')
    .single();
  if (error) throw new Error(error.message);
  return data.costo_unitario_centavos;
}

describe('el costo de lo vendido', () => {
  it('cada renglon guarda el costo de ese momento', async () => {
    const { producto, unidad } = await productoConCosto();
    expect(await vender(producto.id, unidad, 2)).toBe(35_000);
  });

  it('sin costo calculable queda sin costo', async () => {
    const { producto, docena } = await productoConCosto();
    expect(await vender(producto.id, docena, 1)).toBeNull();
  });

  it('la ganancia por producto suma lo vendido con costo y cuenta lo que no tiene', async () => {
    const { producto, unidad, docena } = await productoConCosto();
    const dia = '2026-03-04';
    await vender(producto.id, unidad, 2, dia);
    await vender(producto.id, docena, 1, dia);
    const { data, error } = await (
      await clienteComo('admin')
    ).rpc('ganancia_por_producto', {
      desde: dia,
      hasta: dia,
    });
    expect(error).toBeNull();
    expect(data!.find((fila) => fila.producto_id === producto.id)).toMatchObject({
      unidades: 3,
      ventas_centavos: 300_000,
      costo_centavos: 70_000,
      ganancia_centavos: 130_000,
      sin_costo: 1,
    });
  });

  it('caja no ve la ganancia', async () => {
    const { error } = await (
      await clienteComo('caja')
    ).rpc('ganancia_por_producto', {
      desde: FECHA,
      hasta: FECHA,
    });
    expect(error?.code).toBe('42501');
  });
});
