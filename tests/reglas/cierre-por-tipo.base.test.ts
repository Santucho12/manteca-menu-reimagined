import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { Json } from '../../src/lib/supabase/tipos';
import { borrarCierres, datosDeCierre, diaLibre } from '../cierres-de-prueba';
import { clienteSecretoDePruebas } from '../clientes';
import type { RolDePrueba } from '../cuentas';
import { clienteComo } from '../sesiones';
import {
  borrarVentas,
  datosDeVenta,
  idDeCanal,
  productoParaVender,
  sembrarCanal,
  ventaDe,
  type ParaVender,
} from '../ventas-de-prueba';

const cierres: string[] = [];
const ventas: string[] = [];
const canales: string[] = [];
const categorias: string[] = [];
let producto: ParaVender;
let plataforma: { id: string; nombre: string };

beforeAll(async () => {
  producto = await productoParaVender();
  categorias.push(producto.categoriaId);
});

afterEach(async () => {
  await borrarVentas(ventas.splice(0));
  await borrarCierres(cierres.splice(0));
});

afterAll(() => borrarVentas([], { canales, categoriasDelMenu: categorias }));

async function tipoControlado() {
  plataforma = await sembrarCanal();
  canales.push(plataforma.id);
  const secreto = clienteSecretoDePruebas();
  await secreto
    .from('canales_de_venta')
    .update({ se_controla_en_el_cierre: true })
    .eq('id', plataforma.id);
  return plataforma.id;
}

// El producto de prueba sale $1.000 la unidad.
async function venderEnElMostrador(cambios: Record<string, Json> = {}) {
  const respuesta = await (
    await clienteComo('caja')
  ).rpc('ventas_guardar_mostrador', {
    datos: {
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
      ...cambios,
    },
  });
  const id = (respuesta.data as { id: string } | null)?.id;
  if (id) ventas.push(id);
  return respuesta;
}

async function cargarAMano(fecha: string, canal: string, cambios: Record<string, Json> = {}) {
  const datos = datosDeVenta(fecha, canal, [{ producto, cantidad: 1, precioCentavos: 400000 }], {
    clave: crypto.randomUUID(),
    medio: 'fuera_de_caja',
    turno: 2,
    ...cambios,
  });
  const { data, error } = await (
    await clienteComo('admin')
  ).rpc('ventas_guardar_manual', { datos });
  if (data) ventas.push(data);
  return { id: data, error };
}

async function guardar(rol: RolDePrueba, datos: Json) {
  const respuesta = await (await clienteComo(rol)).rpc('cierres_guardar', { datos });
  if (respuesta.data) cierres.push(respuesta.data);
  return respuesta;
}

type Control = {
  cierre_id: string;
  canal_id: string;
  tipo: string;
  cantidad: number | null;
  total_centavos: number;
  ventas_cantidad: number;
  ventas_centavos: number;
};

async function controles(fecha: string, rol: RolDePrueba = 'admin') {
  const { data, error } = await (
    await clienteComo(rol)
  ).rpc('cierres_controles', { desde: fecha, hasta: fecha });
  if (error) throw new Error(error.message);
  return data as unknown as Control[];
}

describe('el tipo de venta en el mostrador', () => {
  it('sin elegirlo es Local, y se puede elegir otro tipo activo del local', async () => {
    const local = await venderEnElMostrador();
    expect((await ventaDe((local.data as { id: string }).id)).canal_id).toBe(
      await idDeCanal('Local'),
    );
    const canal = await tipoControlado();
    const otra = await venderEnElMostrador({ canal_id: canal });
    expect((await ventaDe((otra.data as { id: string }).id)).canal_id).toBe(canal);
  });

  it('un tipo inactivo o de otro local se rechaza', async () => {
    const inactivo = await sembrarCanal(false);
    canales.push(inactivo.id);
    expect((await venderEnElMostrador({ canal_id: inactivo.id })).error?.code).toBe('PV316');
    const ajeno = await idDeCanal('Local', true);
    expect((await venderEnElMostrador({ canal_id: ajeno })).error?.code).toBe('PV316');
  });

  it('«Fuera de la caja» se guarda como medio de pago', async () => {
    const venta = await venderEnElMostrador({
      pagos: [{ medio: 'fuera_de_caja', monto_centavos: 100000 }],
    });
    expect(venta.error).toBeNull();
  });
});

describe('Local no se controla en el cierre', () => {
  it('la base no deja prenderlo en el tipo del sistema', async () => {
    const { error } = await (
      await clienteComo('admin')
    )
      .from('canales_de_venta')
      .update({ se_controla_en_el_cierre: true })
      .eq('id', await idDeCanal('Local'));
    expect(error).not.toBeNull();
  });
});

describe('el cierre por tipo', () => {
  it('guarda lo anotado y lo compara con lo cargado de ese tipo en el turno', async () => {
    const fecha = diaLibre();
    const canal = await tipoControlado();
    await cargarAMano(fecha, canal);
    await cargarAMano(fecha, canal, { turno: 1 });
    const { data: id, error } = await guardar(
      'caja',
      datosDeCierre(fecha, {
        turno: 2,
        controles: [{ canal_id: canal, cantidad: 1, total_centavos: 450000 }],
      }),
    );
    expect(error).toBeNull();
    expect(await controles(fecha)).toEqual([
      expect.objectContaining({
        cierre_id: id,
        canal_id: canal,
        tipo: plataforma.nombre,
        cantidad: 1,
        total_centavos: 450000,
        ventas_cantidad: 1,
        ventas_centavos: 400000,
      }),
    ]);
  });

  it('la cantidad es opcional', async () => {
    const fecha = diaLibre();
    const canal = await tipoControlado();
    await guardar(
      'caja',
      datosDeCierre(fecha, { controles: [{ canal_id: canal, cantidad: null, total_centavos: 0 }] }),
    );
    expect((await controles(fecha))[0]).toMatchObject({ cantidad: null, ventas_cantidad: 0 });
  });

  it('caja ve los controles de sus cierres y el admin los edita', async () => {
    const fecha = diaLibre();
    const canal = await tipoControlado();
    const { data: id } = await guardar(
      'caja',
      datosDeCierre(fecha, { controles: [{ canal_id: canal, total_centavos: 100 }] }),
    );
    expect(await controles(fecha, 'caja')).toHaveLength(1);
    const { error } = await (
      await clienteComo('admin')
    ).rpc('cierres_editar', {
      el_id: id!,
      datos: datosDeCierre(fecha, { controles: [{ canal_id: canal, total_centavos: 900 }] }),
    });
    expect(error).toBeNull();
    expect((await controles(fecha))[0]?.total_centavos).toBe(900);
  });

  it('un tipo que no se controla no se anota', async () => {
    const fecha = diaLibre();
    const { error } = await guardar(
      'caja',
      datosDeCierre(fecha, {
        controles: [{ canal_id: await idDeCanal('Encargo'), total_centavos: 100 }],
      }),
    );
    expect(error?.code).toBe('PC311');
  });

  it('una venta «Fuera de la caja» no cambia lo esperado de la caja', async () => {
    const fecha = diaLibre();
    const canal = await tipoControlado();
    await cargarAMano(fecha, canal, { en_la_caja: true });
    const { data: id } = await guardar('caja', datosDeCierre(fecha));
    const { data } = await (
      await clienteComo('admin')
    ).rpc('cierres_con_resultado', { desde: fecha, hasta: fecha });
    const fila = (data as unknown as Record<string, number | string>[]).find((f) => f.id === id);
    const medios = ['efectivo', 'credito', 'debito', 'qr', 'transferencia'];
    expect(medios.map((m) => fila?.[`ventas_${m}_centavos`])).toEqual([0, 0, 0, 0, 0]);
  });
});

describe('los tipos para vender', () => {
  it('caja los lee, con cuáles se controlan', async () => {
    const canal = await tipoControlado();
    const { data, error } = await (await clienteComo('caja')).rpc('caja_tipos_para_vender');
    expect(error).toBeNull();
    const tipos = data as unknown as {
      id: string;
      nombre: string;
      se_controla_en_el_cierre: boolean;
    }[];
    expect(tipos).toContainEqual(
      expect.objectContaining({ id: canal, se_controla_en_el_cierre: true }),
    );
    expect(tipos.find((t) => t.nombre === 'Local')).toBeDefined();
  });
});
