import { afterAll, describe, expect, it } from 'vitest';
import { listarProveedores, proveedorPorId } from '../../src/lib/proveedores/consultas';
import {
  cambiarEstadoDeProveedor,
  crearProveedor,
  editarProveedor,
} from '../../src/lib/proveedores/escritura';
import type { DatosDeProveedor } from '../../src/lib/proveedores/esquemas';
import { idDeCuentaDePrueba, registrosDe } from '../consultas-de-prueba';
import {
  borrarProveedores,
  nombreDeProveedor,
  proveedorDe,
  sembrarProveedor,
} from '../proveedores-de-prueba';
import { clienteComo } from '../sesiones';

const creados: string[] = [];
afterAll(() => borrarProveedores(creados));

const TODOS = { busqueda: null, desactivados: false, pagina: 1 };

function datos(nombre: string): DatosDeProveedor {
  return {
    nombre,
    telefono: '11 2345 6789',
    ubicacion: '',
    queCompra: 'Harina',
    observaciones: '',
  };
}

async function sembrar(...args: Parameters<typeof sembrarProveedor>) {
  const proveedor = await sembrarProveedor(...args);
  creados.push(proveedor.id);
  return proveedor;
}

async function nombresQueVe(filtros: Partial<typeof TODOS>): Promise<string[]> {
  const { filas } = await listarProveedores(await clienteComo('admin'), { ...TODOS, ...filtros });
  return filas.map((fila) => fila.nombre);
}

describe('crearProveedor', () => {
  it('crea uno con el telefono normalizado', async () => {
    const resultado = await crearProveedor(
      await clienteComo('admin'),
      datos(nombreDeProveedor()),
      false,
    );
    if (!resultado.ok || resultado.datos.estado !== 'creado') throw new Error('No se creo');
    creados.push(resultado.datos.id);
    expect((await proveedorDe(resultado.datos.id)).telefono).toBe('5491123456789');
  });

  it('con un nombre que ya existe, en otra mayuscula, pide confirmar y despues crea', async () => {
    const existente = await sembrar();
    const admin = await clienteComo('admin');
    const repetido = datos(existente.nombre.toUpperCase());
    expect(await crearProveedor(admin, repetido, false)).toEqual({
      ok: true,
      datos: { estado: 'confirmar', nombre: existente.nombre },
    });
    const resultado = await crearProveedor(admin, repetido, true);
    if (!resultado.ok || resultado.datos.estado !== 'creado') throw new Error('No se creo');
    creados.push(resultado.datos.id);
  });

  it('caja no crea proveedores', async () => {
    expect(
      await crearProveedor(await clienteComo('caja'), datos(nombreDeProveedor()), true),
    ).toEqual({
      ok: false,
      mensaje: 'No tenés permiso para hacer esto.',
    });
  });
});

describe('listarProveedores', () => {
  it('busca por parte del nombre y el guion bajo no es comodin', async () => {
    const proveedor = await sembrar({ nombre: `Molino_${nombreDeProveedor()}` });
    expect(await nombresQueVe({ busqueda: proveedor.nombre.slice(0, 12) })).toContain(
      proveedor.nombre,
    );
    const conPunto = proveedor.nombre.replace('_', '.');
    expect(await nombresQueVe({ busqueda: conPunto })).toEqual([]);
  });

  it('los desactivados aparecen solo con el filtro', async () => {
    const desactivado = await sembrar({ activo: false });
    expect(await nombresQueVe({ busqueda: desactivado.nombre })).toEqual([]);
    expect(await nombresQueVe({ busqueda: desactivado.nombre, desactivados: true })).toEqual([
      desactivado.nombre,
    ]);
  });

  it('no trae los de otro local', async () => {
    const ajeno = await sembrar({ otroLocal: true });
    expect(await nombresQueVe({ busqueda: ajeno.nombre })).toEqual([]);
  });

  it('una pagina de mas muestra la ultima', async () => {
    const admin = await clienteComo('admin');
    const lejana = await listarProveedores(admin, { ...TODOS, pagina: 99 });
    expect(lejana.pagina).toBeLessThan(99);
  });
});

describe('editar, desactivar y reactivar', () => {
  it('editar cambia los datos y queda a nombre del admin', async () => {
    const proveedor = await sembrar();
    const resultado = await editarProveedor(
      await clienteComo('admin'),
      proveedor.id,
      datos('Otro nombre'),
    );
    expect(resultado.ok).toBe(true);
    expect((await proveedorPorId(await clienteComo('admin'), proveedor.id))?.nombre).toBe(
      'Otro nombre',
    );
    const admin = await idDeCuentaDePrueba('admin');
    expect(await registrosDe(proveedor.id)).toContainEqual(
      expect.objectContaining({ accion: 'cambio', usuario_id: admin }),
    );
  });

  it('desactivar y reactivar quedan en la auditoria', async () => {
    const proveedor = await sembrar();
    const admin = await clienteComo('admin');
    expect((await cambiarEstadoDeProveedor(admin, proveedor.id, false)).ok).toBe(true);
    expect((await cambiarEstadoDeProveedor(admin, proveedor.id, true)).ok).toBe(true);
    const acciones = (await registrosDe(proveedor.id)).map((r) => r.accion);
    expect(acciones).toEqual(expect.arrayContaining(['desactivacion', 'reactivacion']));
  });

  it('el admin de otro local no lo edita y recibe un mensaje', async () => {
    const proveedor = await sembrar();
    const otro = await clienteComo('adminOtroLocal');
    expect(await editarProveedor(otro, proveedor.id, datos('Robado'))).toEqual({
      ok: false,
      mensaje: 'Ese proveedor ya no está disponible. Recargá la página.',
    });
    expect((await proveedorDe(proveedor.id)).nombre).toBe(proveedor.nombre);
  });
});
