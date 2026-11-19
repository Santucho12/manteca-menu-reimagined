import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Cliente } from '../../src/lib/supabase/cliente';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import { clienteComo } from '../sesiones';
import { borrarVentas, idsDeVentasDelProducto, productoParaVender } from '../ventas-de-prueba';

// Las funciones nuevas se llaman por su nombre: las internas no las ofrece la aplicación.
type Respuesta = { error: { code?: string } | null };
type Rpc = (funcion: string, argumentos?: object) => PromiseLike<Respuesta>;
const rpc = (cliente: Cliente): Rpc => cliente.rpc.bind(cliente) as unknown as Rpc;

let producto: Awaited<ReturnType<typeof productoParaVender>>;

beforeAll(async () => {
  producto = await productoParaVender();
});

afterAll(async () => {
  await borrarVentas(await idsDeVentasDelProducto(producto.productoId), {
    categoriasDelMenu: [producto.categoriaId],
  });
});

const venta = () => ({
  clave: crypto.randomUUID(),
  renglones: [
    {
      producto_id: producto.productoId,
      presentacion_id: producto.presentacionId,
      cantidad: 1,
      precio_centavos: 100000,
    },
  ],
  pagos: [{ medio: 'efectivo', monto_centavos: 100000 }],
});

async function sinPermiso(): Promise<[string, Cliente][]> {
  const roles = ['invitado', 'encargado', 'desactivado'] as const;
  const conSesion = await Promise.all(
    roles.map(async (rol) => [rol, await clienteComo(rol)] as [string, Cliente]),
  );
  return [['visitante', crearClienteSinSesion()], ...conSesion];
}

describe('vender en el mostrador, por RPC', () => {
  it('sin ser caja ni admin activos, no se lee el catálogo ni se vende', async () => {
    for (const [quien, cliente] of await sinPermiso()) {
      expect((await rpc(cliente)('catalogo_para_vender')).error?.code, quien).toBe('42501');
      const guardar = await rpc(cliente)('ventas_guardar_mostrador', { datos: venta() });
      expect(guardar.error?.code, quien).toBe('42501');
    }
    expect(await idsDeVentasDelProducto(producto.productoId)).toEqual([]);
  });

  it('el admin de otro local no vende lo del menú de este', async () => {
    const otro = await clienteComo('adminOtroLocal');
    const { error } = await rpc(otro)('ventas_guardar_mostrador', { datos: venta() });
    expect(error?.code).toBe('PV304');
  });

  it('nadie llama a las piezas internas de la venta', async () => {
    const internas: [string, object][] = [
      ['ventas_renglones_del_mostrador', { el_local: producto.categoriaId, datos: venta() }],
      ['ventas_validar_mostrador', { el_local: producto.categoriaId, datos: venta() }],
      ['ventas_validar_pagos_del_mostrador', { datos: venta(), el_total: 100000 }],
    ];
    for (const rol of ['caja', 'admin'] as const) {
      const cliente = await clienteComo(rol);
      for (const [funcion, argumentos] of internas) {
        expect((await rpc(cliente)(funcion, argumentos)).error?.code, funcion).toBe('42501');
      }
    }
  });
});
