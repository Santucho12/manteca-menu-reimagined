import { afterAll, describe, expect, it } from 'vitest';
import { idDeCuentaDePrueba, registrosDe } from '../consultas-de-prueba';
import {
  borrarGastos,
  gastoDe,
  idDeCategoria,
  sembrarCategoriaDeGasto,
  sembrarGasto,
} from '../gastos-de-prueba';
import { borrarProveedores, sembrarProveedor } from '../proveedores-de-prueba';
import { clienteComo } from '../sesiones';

const gastos: string[] = [];
const categorias: string[] = [];
const proveedores: string[] = [];
afterAll(async () => {
  await borrarGastos({ gastos, categorias });
  await borrarProveedores(proveedores);
});

async function cargar(cambios: Record<string, unknown>) {
  const fila = { fecha: '2026-10-02', monto_centavos: 150000, medio_de_pago: 'otro', ...cambios };
  const respuesta = await (
    await clienteComo('admin')
  )
    .from('gastos')
    .insert(fila as never)
    .select('id')
    .single();
  if (respuesta.data) gastos.push(respuesta.data.id);
  return respuesta;
}

async function cambiar(id: string, cambios: Record<string, unknown>) {
  return (await clienteComo('admin'))
    .from('gastos')
    .update(cambios as never)
    .eq('id', id);
}

async function proveedor(activo = true) {
  const sembrado = await sembrarProveedor({ activo });
  proveedores.push(sembrado.id);
  return sembrado.id;
}

describe('reglas de gastos', () => {
  it('Sin clasificar no se elige a mano', async () => {
    const { error } = await cargar({ categoria_id: await idDeCategoria('Sin clasificar') });
    expect(error?.code).toBe('PG201');
  });

  it('no se usa una categoria desactivada ni una de otro local', async () => {
    const apagada = await sembrarCategoriaDeGasto({ activo: false });
    categorias.push(apagada.id);
    expect((await cargar({ categoria_id: apagada.id })).error?.code).toBe('PG201');
    expect(
      (await cargar({ categoria_id: await idDeCategoria('Alquiler', true) })).error?.code,
    ).toBe('PG201');
  });

  it('Mercaderia pide proveedor', async () => {
    const mercaderia = await idDeCategoria('Mercadería');
    expect((await cargar({ categoria_id: mercaderia })).error?.code).toBe('PG202');
    expect(
      (await cargar({ categoria_id: mercaderia, proveedor_id: await proveedor() })).error,
    ).toBeNull();
  });

  it('no se elige un proveedor desactivado, pero un gasto viejo lo conserva al editarse', async () => {
    const apagado = await proveedor(false);
    const alquiler = await idDeCategoria('Alquiler');
    expect((await cargar({ categoria_id: alquiler, proveedor_id: apagado })).error?.code).toBe(
      'PG203',
    );
    const viejo = await sembrarGasto({ proveedorId: apagado });
    gastos.push(viejo.id);
    expect((await cambiar(viejo.id, { descripcion: 'Luz de octubre' })).error).toBeNull();
  });

  it('anular pide motivo, anota quien y cuando, y deja el gasto cerrado', async () => {
    const gasto = await sembrarGasto();
    gastos.push(gasto.id);
    expect((await cambiar(gasto.id, { anulado: true })).error?.code).toBe('PG205');
    expect(
      (await cambiar(gasto.id, { anulado: true, motivo_anulacion: 'Duplicado' })).error,
    ).toBeNull();
    const fila = await gastoDe(gasto.id);
    expect(fila).toMatchObject({ anulado: true, anulado_por: await idDeCuentaDePrueba('admin') });
    expect(fila.fecha_anulacion).not.toBeNull();
    expect((await cambiar(gasto.id, { monto_centavos: 1 })).error?.code).toBe('PG204');
    expect((await cambiar(gasto.id, { anulado: false })).error?.code).toBe('PG204');
    expect(await registrosDe(gasto.id)).toContainEqual(
      expect.objectContaining({ accion: 'anulacion' }),
    );
  });

  it('un monto en cero no se acepta', async () => {
    const { error } = await cargar({
      categoria_id: await idDeCategoria('Alquiler'),
      monto_centavos: 0,
    });
    expect(error?.code).toBe('23514');
  });

  it('Sin clasificar no se renombra ni se desactiva', async () => {
    const id = await idDeCategoria('Sin clasificar');
    const admin = await clienteComo('admin');
    const { error } = await admin
      .from('categorias_de_gasto')
      .update({ nombre: 'Otra' })
      .eq('id', id);
    expect(error?.code).toBe('PG206');
  });

  it('dos categorias no se llaman igual en un local', async () => {
    const { error } = await (
      await clienteComo('admin')
    )
      .from('categorias_de_gasto')
      .insert({ nombre: 'ALQUILER' });
    expect(error?.code).toBe('23505');
  });
});
