import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  altaDe,
  listarRegistros,
  nombresDe,
  personasDeAuditoria,
  registroPorId,
} from '../../src/lib/auditoria/consultas';
import type { FiltrosDeAuditoria } from '../../src/lib/auditoria/pantalla';
import { diaEnArgentina } from '../../src/lib/fechas';
import { crearGasto, editarGasto } from '../../src/lib/gastos/escritura';
import type { DatosDeGasto } from '../../src/lib/gastos/esquemas';
import { idDeCuentaDePrueba } from '../consultas-de-prueba';
import { borrarGastos, sembrarCategoriaDeGasto } from '../gastos-de-prueba';
import { borrarProveedores, sembrarProveedor } from '../proveedores-de-prueba';
import { clienteComo } from '../sesiones';

const HOY = diaEnArgentina(new Date());
let gastoId: string;
let proveedorId: string;
let categoria: { id: string; nombre: string };

const datos = (monto: string): DatosDeGasto => ({
  fecha: HOY,
  categoriaId: categoria.id,
  monto,
  descripcion: 'Para la auditoria',
  proveedorId: '',
  medioDePago: 'transferencia',
  comprobante: '',
});

beforeAll(async () => {
  categoria = await sembrarCategoriaDeGasto();
  const admin = await clienteComo('admin');
  const creado = await crearGasto(admin, datos('1.000'));
  if (!creado.ok) throw new Error(creado.mensaje);
  gastoId = creado.datos.id;
  await editarGasto(admin, gastoId, datos('2.500,50'));
  proveedorId = (await sembrarProveedor()).id;
});

afterAll(async () => {
  await borrarGastos({ gastos: [gastoId], categorias: [categoria.id] });
  await borrarProveedores([proveedorId]);
});

const filtros = (cambios: Partial<FiltrosDeAuditoria> = {}): FiltrosDeAuditoria => ({
  desde: HOY,
  hasta: HOY,
  persona: null,
  modulo: null,
  accion: null,
  pagina: 1,
  ...cambios,
});

async function delGasto(cambios: Partial<FiltrosDeAuditoria>) {
  const { filas } = await listarRegistros(await clienteComo('admin'), filtros(cambios));
  return filas.filter((fila) => fila.registro_id === gastoId).map((fila) => fila.accion);
}

describe('listarRegistros', () => {
  it('trae lo de hoy, lo mas nuevo primero', async () => {
    expect(await delGasto({ modulo: 'gastos', accion: null })).toEqual(['cambio', 'alta']);
  });

  it('filtra por persona, modulo y accion', async () => {
    const admin = await idDeCuentaDePrueba('admin');
    expect(await delGasto({ persona: admin, modulo: 'gastos', accion: 'cambio' })).toEqual([
      'cambio',
    ]);
    expect(await delGasto({ modulo: 'caja' })).toEqual([]);
    expect(await delGasto({ persona: await idDeCuentaDePrueba('caja') })).toEqual([]);
  });

  it('lo del sistema se filtra aparte', async () => {
    const { filas } = await listarRegistros(
      await clienteComo('admin'),
      filtros({ persona: 'sistema', modulo: 'proveedores' }),
    );
    expect(filas.map((fila) => fila.registro_id)).toContain(proveedorId);
    expect(filas.every((fila) => fila.usuario_id === null)).toBe(true);
  });

  it('un dia sin registros no trae nada', async () => {
    const lista = await listarRegistros(
      await clienteComo('admin'),
      filtros({ desde: '2001-01-01', hasta: '2001-01-02' }),
    );
    expect(lista).toEqual({ filas: [], total: 0, pagina: 1 });
  });

  it('caja no ve la auditoria', async () => {
    const { filas } = await listarRegistros(await clienteComo('caja'), filtros());
    expect(filas).toEqual([]);
  });
});

describe('detalle, nombres y alta', () => {
  it('el detalle de un registro, y null si el id no sirve', async () => {
    const admin = await clienteComo('admin');
    const { filas } = await listarRegistros(admin, filtros({ modulo: 'gastos' }));
    const cambio = filas.find((fila) => fila.registro_id === gastoId && fila.accion === 'cambio');
    const detalle = await registroPorId(admin, String(cambio!.id));
    expect(detalle?.antes).toMatchObject({ monto_centavos: 100000 });
    expect(detalle?.despues).toMatchObject({ monto_centavos: 250050 });
    expect(await registroPorId(admin, 'abc')).toBeNull();
  });

  it('resuelve los nombres de la persona y la categoria', async () => {
    const admin = await clienteComo('admin');
    const { filas } = await listarRegistros(admin, filtros({ modulo: 'gastos', accion: 'alta' }));
    const alta = filas.filter((fila) => fila.registro_id === gastoId);
    const nombres = await nombresDe(admin, alta);
    expect(nombres.get(await idDeCuentaDePrueba('admin'))).toBe('Prueba Admin');
    expect(nombres.get(categoria.id)).toBe(categoria.nombre);
  });

  it('quien cargo un dato y cuando, o el sistema', async () => {
    const admin = await clienteComo('admin');
    expect(await altaDe(admin, 'gastos', gastoId)).toMatchObject({ persona: 'Prueba Admin' });
    expect(await altaDe(admin, 'proveedores', proveedorId)).toMatchObject({
      persona: 'El sistema',
    });
    expect(await altaDe(admin, 'gastos', '00000000-0000-4000-8000-000000000000')).toBeNull();
  });

  it('las personas para filtrar, con las desactivadas', async () => {
    const personas = await personasDeAuditoria(await clienteComo('admin'));
    const nombres = personas.map((persona) => persona.nombre);
    expect(nombres).toEqual(expect.arrayContaining(['Prueba Admin', 'Prueba Desactivado']));
  });
});
