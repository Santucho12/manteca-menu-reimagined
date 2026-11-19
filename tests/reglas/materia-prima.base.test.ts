import { afterAll, describe, expect, it } from 'vitest';
import { idDeCuentaDePrueba, registrosDe } from '../consultas-de-prueba';
import {
  borrarInsumos,
  nombreDeInsumo,
  sembrarFormaDeCompra,
  sembrarInsumo,
} from '../materia-prima-de-prueba';
import { borrarProveedores, sembrarProveedor } from '../proveedores-de-prueba';
import { clienteComo } from '../sesiones';

const insumos: string[] = [];
const proveedores: string[] = [];

afterAll(async () => {
  await borrarInsumos(insumos);
  await borrarProveedores(proveedores);
});

async function insumoNuevo(semilla: Parameters<typeof sembrarInsumo>[0] = {}) {
  const insumo = await sembrarInsumo(semilla);
  insumos.push(insumo.id);
  return insumo;
}

async function cargarForma(fila: { insumo_id: string; proveedor_id?: string; contenido?: number }) {
  return (await clienteComo('admin'))
    .from('formas_de_compra')
    .insert({ como_se_compra: 'Bolsa de 25 kg', contenido: 25000, ...fila });
}

async function costoDe(insumoId: string) {
  const { data, error } = await (await clienteComo('admin')).rpc('costo_de_insumos');
  expect(error).toBeNull();
  return (data ?? []).find((fila) => fila.insumo_id === insumoId);
}

describe('reglas de las formas de compra', () => {
  it('un insumo de otro local no se usa: PI301', async () => {
    const ajeno = await insumoNuevo({ otroLocal: true });
    expect((await cargarForma({ insumo_id: ajeno.id })).error?.code).toBe('PI301');
  });

  it('un proveedor de otro local no se usa: PI301', async () => {
    const insumo = await insumoNuevo();
    const ajeno = await sembrarProveedor({ otroLocal: true });
    proveedores.push(ajeno.id);
    const alta = await cargarForma({ insumo_id: insumo.id, proveedor_id: ajeno.id });
    expect(alta.error?.code).toBe('PI301');
  });

  it('tampoco al cambiar el proveedor de una forma: PI301', async () => {
    const insumo = await insumoNuevo();
    const forma = await sembrarFormaDeCompra({ insumoId: insumo.id, localId: insumo.local_id });
    const ajeno = await sembrarProveedor({ otroLocal: true });
    proveedores.push(ajeno.id);
    const { error } = await (
      await clienteComo('admin')
    )
      .from('formas_de_compra')
      .update({ proveedor_id: ajeno.id })
      .eq('id', forma);
    expect(error?.code).toBe('PI301');
  });

  it('un insumo desactivado no lleva formas nuevas: PI302', async () => {
    const apagado = await insumoNuevo({ activo: false });
    expect((await cargarForma({ insumo_id: apagado.id })).error?.code).toBe('PI302');
  });

  it('el contenido tiene que ser mayor que cero', async () => {
    const insumo = await insumoNuevo();
    const alta = await cargarForma({ insumo_id: insumo.id, contenido: 0 });
    expect(alta.error?.code).toBe('23514');
  });
});

describe('costo de los insumos', () => {
  it('sin precio de referencia no tiene costo', async () => {
    const insumo = await insumoNuevo();
    await sembrarFormaDeCompra({
      insumoId: insumo.id,
      localId: insumo.local_id,
      precioCentavos: null,
    });
    expect(await costoDe(insumo.id)).toMatchObject({ costo_por_unidad: null, origen: null });
  });

  it('da el precio de referencia por unidad de uso, con fraccion de centavo', async () => {
    const insumo = await insumoNuevo();
    await sembrarFormaDeCompra({ insumoId: insumo.id, localId: insumo.local_id });
    // $32.000 la bolsa de 25 kg: $1,28 el gramo.
    const costo = await costoDe(insumo.id);
    expect(Number(costo?.costo_por_unidad)).toBe(128);
    expect(costo?.origen).toBe('referencia');
  });

  it('gana la forma de compra cambiada por ultima vez', async () => {
    const insumo = await insumoNuevo();
    const vieja = await sembrarFormaDeCompra({ insumoId: insumo.id, localId: insumo.local_id });
    await sembrarFormaDeCompra({
      insumoId: insumo.id,
      localId: insumo.local_id,
      contenido: 50000,
      precioCentavos: 5_000_000,
    });
    await (
      await clienteComo('admin')
    )
      .from('formas_de_compra')
      .update({ precio_referencia_centavos: 3_000_000 })
      .eq('id', vieja);
    expect(Number((await costoDe(insumo.id))?.costo_por_unidad)).toBe(120);
  });

  it('una forma desactivada no cuenta', async () => {
    const insumo = await insumoNuevo();
    await sembrarFormaDeCompra({ insumoId: insumo.id, localId: insumo.local_id, activo: false });
    expect((await costoDe(insumo.id))?.costo_por_unidad).toBeNull();
  });
});

describe('auditoria de materia prima', () => {
  it('el alta de un insumo queda con quien lo cargo', async () => {
    const { data } = await (
      await clienteComo('admin')
    )
      .from('insumos')
      .insert({ nombre: nombreDeInsumo(), unidad_de_uso: 'unidad' })
      .select('id')
      .single();
    insumos.push(data!.id);
    const [registro] = await registrosDe(data!.id);
    expect(registro).toMatchObject({
      accion: 'alta',
      usuario_id: await idDeCuentaDePrueba('admin'),
    });
  });

  it('el cambio de precio de una forma queda con el valor anterior', async () => {
    const insumo = await insumoNuevo();
    const forma = await sembrarFormaDeCompra({ insumoId: insumo.id, localId: insumo.local_id });
    await (
      await clienteComo('admin')
    )
      .from('formas_de_compra')
      .update({ precio_referencia_centavos: 3_300_000 })
      .eq('id', forma);
    expect(await registrosDe(forma)).toContainEqual(
      expect.objectContaining({
        accion: 'cambio',
        antes: { precio_referencia_centavos: 3_200_000 },
        despues: { precio_referencia_centavos: 3_300_000 },
      }),
    );
  });
});
