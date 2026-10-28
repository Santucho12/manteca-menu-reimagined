import { afterAll, describe, expect, it } from 'vitest';
import {
  gastoPorId,
  listarCategorias,
  listarGastos,
  listarRecurrentes,
  opcionesDeGasto,
} from '../../src/lib/gastos/consultas';
import {
  anularGasto,
  cambiarEstadoDeCategoria,
  cambiarEstadoDeRecurrente,
  crearCategoria,
  crearGasto,
  crearRecurrente,
  editarCategoria,
  editarGasto,
  MENSAJES_DE_GASTOS,
} from '../../src/lib/gastos/escritura';
import type { DatosDeGasto } from '../../src/lib/gastos/esquemas';
import { generarAlAbrir, generarAtrasados } from '../../src/lib/gastos/generacion';
import {
  pagadoPorProveedor,
  recurrentesActivosDelProveedor,
  totalesDelProveedor,
} from '../../src/lib/gastos/proveedores';
import { clienteSecretoDePruebas } from '../clientes';
import { idDeCuentaDePrueba } from '../consultas-de-prueba';
import {
  borrarGastos,
  gastoDe,
  idDeCategoria,
  sembrarCategoriaDeGasto,
  sembrarGasto,
  sembrarRecurrente,
} from '../gastos-de-prueba';
import { borrarProveedores, sembrarProveedor } from '../proveedores-de-prueba';
import { clienteComo } from '../sesiones';

const gastos: string[] = [];
const recurrentes: string[] = [];
const categorias: string[] = [];
const proveedores: string[] = [];
afterAll(async () => {
  await borrarGastos({ gastos, recurrentes, categorias });
  await borrarProveedores(proveedores);
});

async function categoriaPropia() {
  const { id } = await sembrarCategoriaDeGasto();
  categorias.push(id);
  return id;
}

async function proveedorPropio() {
  const { id } = await sembrarProveedor();
  proveedores.push(id);
  return id;
}

async function gasto(semilla: Parameters<typeof sembrarGasto>[0]) {
  const { id } = await sembrarGasto(semilla);
  gastos.push(id);
  return id;
}

const datos = (cambios: Partial<DatosDeGasto>): DatosDeGasto => ({
  fecha: '2031-05-10',
  categoriaId: '',
  monto: '1.500,25',
  descripcion: '',
  proveedorId: '',
  medioDePago: 'transferencia',
  comprobante: '',
  ...cambios,
});

const admin = () => clienteComo('admin');

describe('cargar y editar gastos', () => {
  it('carga un gasto en centavos a nombre de quien lo carga', async () => {
    const resultado = await crearGasto(
      await admin(),
      datos({ categoriaId: await categoriaPropia() }),
    );
    if (!resultado.ok) throw new Error(resultado.mensaje);
    gastos.push(resultado.datos.id);
    const fila = await gastoDe(resultado.datos.id);
    expect(fila).toMatchObject({
      monto_centavos: 150025,
      creado_por: await idDeCuentaDePrueba('admin'),
    });
  });

  it('explica las reglas de la base', async () => {
    const mercaderia = await idDeCategoria('Mercadería');
    expect(await crearGasto(await admin(), datos({ categoriaId: mercaderia }))).toEqual({
      ok: false,
      mensaje: MENSAJES_DE_GASTOS.pideProveedor,
    });
    const sinClasificar = await idDeCategoria('Sin clasificar');
    const resultado = await crearGasto(await admin(), datos({ categoriaId: sinClasificar }));
    expect(resultado).toEqual({ ok: false, mensaje: MENSAJES_DE_GASTOS.categoriaNoDisponible });
  });

  it('caja no carga gastos', async () => {
    const resultado = await crearGasto(
      await clienteComo('caja'),
      datos({ categoriaId: await idDeCategoria('Alquiler') }),
    );
    expect(resultado).toEqual({ ok: false, mensaje: MENSAJES_DE_GASTOS.sinPermiso });
  });

  it('edita, anula con motivo y ya no deja cambiarlo', async () => {
    const categoriaId = await categoriaPropia();
    const id = await gasto({ categoriaId, fecha: '2031-05-11' });
    const cliente = await admin();
    expect((await editarGasto(cliente, id, datos({ categoriaId, monto: '99' }))).ok).toBe(true);
    expect((await gastoDe(id)).monto_centavos).toBe(9900);
    expect((await anularGasto(cliente, id, 'Duplicado')).ok).toBe(true);
    expect(await editarGasto(cliente, id, datos({ categoriaId }))).toEqual({
      ok: false,
      mensaje: MENSAJES_DE_GASTOS.anulado,
    });
  });

  it('un gasto de otro local no se toca ni se ve', async () => {
    const id = await gasto({ otroLocal: true });
    const cliente = await admin();
    expect(await anularGasto(cliente, id, 'x')).toEqual({
      ok: false,
      mensaje: MENSAJES_DE_GASTOS.noDisponible,
    });
    expect(await gastoPorId(cliente, id)).toBeNull();
    expect(await gastoPorId(cliente, 'no-es-un-id')).toBeNull();
  });
});

describe('lista de gastos', () => {
  it('filtra por fechas y categoria, y el total no cuenta lo anulado', async () => {
    const { id: categoriaId, nombre } = await sembrarCategoriaDeGasto();
    categorias.push(categoriaId);
    await gasto({ categoriaId, fecha: '2031-06-01', montoCentavos: 1000 });
    await gasto({ categoriaId, fecha: '2031-06-30', montoCentavos: 250 });
    await gasto({ categoriaId, fecha: '2031-06-15', montoCentavos: 7777, anulado: true });
    await gasto({ categoriaId, fecha: '2031-07-01', montoCentavos: 5 });
    const filtros = {
      desde: '2031-06-01',
      hasta: '2031-06-30',
      categoriaId,
      proveedorId: null,
      pagina: 1,
    };
    const lista = await listarGastos(await admin(), filtros);
    expect(lista.totalCentavos).toBe(1250);
    expect(lista.filas.map((f) => [f.fecha, f.anulado])).toEqual([
      ['2031-06-30', false],
      ['2031-06-15', true],
      ['2031-06-01', false],
    ]);
    expect(lista.filas[0]!.categoria).toBe(nombre);
  });

  it('las opciones no ofrecen Sin clasificar y marcan Mercaderia', async () => {
    const { categorias: opciones } = await opcionesDeGasto(await admin());
    expect(opciones.map((c) => c.nombre)).not.toContain('Sin clasificar');
    expect(opciones.find((c) => c.nombre === 'Mercadería')?.pide_proveedor).toBe(true);
  });
});

describe('recurrentes', () => {
  it('se crean, se listan y se desactivan', async () => {
    const cliente = await admin();
    const resultado = await crearRecurrente(cliente, {
      ...datos({ categoriaId: await idDeCategoria('Alquiler'), descripcion: 'Alquiler del local' }),
      fecha: '2099-01-10',
      seRepite: 'mensual',
    });
    if (!resultado.ok) throw new Error(resultado.mensaje);
    recurrentes.push(resultado.datos.id);
    const fila = (await listarRecurrentes(cliente)).find((r) => r.id === resultado.datos.id);
    expect(fila).toMatchObject({
      descripcion: 'Alquiler del local',
      categoria: 'Alquiler',
      activo: true,
    });
    expect((await cambiarEstadoDeRecurrente(cliente, resultado.datos.id, false)).ok).toBe(true);
  });

  it('generar lo atrasado crea los vencimientos que faltan', async () => {
    const { id } = await sembrarRecurrente({ primerVencimiento: '2031-01-20' });
    recurrentes.push(id);
    expect(await generarAtrasados(clienteSecretoDePruebas(), '2031-03-20')).toBeGreaterThanOrEqual(
      3,
    );
    expect(await generarAtrasados(clienteSecretoDePruebas(), '2031-03-20')).toBe(0);
  });

  it('al abrir Gastos genera solo si quien abre es admin', async () => {
    const { id } = await sembrarRecurrente({ primerVencimiento: '2032-01-20' });
    recurrentes.push(id);
    expect(await generarAlAbrir('caja', '2032-01-20')).toBe(0);
    expect(await generarAlAbrir('admin', '2032-01-20')).toBeGreaterThanOrEqual(1);
  });
});

describe('categorias', () => {
  it('no repite un nombre y no toca Sin clasificar', async () => {
    const cliente = await admin();
    expect(await crearCategoria(cliente, { nombre: 'alquiler', pideProveedor: false })).toEqual({
      ok: false,
      mensaje: MENSAJES_DE_GASTOS.categoriaRepetida,
    });
    const sinClasificar = await idDeCategoria('Sin clasificar');
    expect(
      await editarCategoria(cliente, sinClasificar, { nombre: 'Otra', pideProveedor: false }),
    ).toEqual({
      ok: false,
      mensaje: MENSAJES_DE_GASTOS.deSistema,
    });
  });

  it('se crea, se renombra y se desactiva', async () => {
    const cliente = await admin();
    const nombre = `Cat ${Date.now()}`;
    const creada = await crearCategoria(cliente, { nombre, pideProveedor: true });
    if (!creada.ok) throw new Error(creada.mensaje);
    categorias.push(creada.datos.id);
    expect(
      (
        await editarCategoria(cliente, creada.datos.id, {
          nombre: `${nombre} b`,
          pideProveedor: false,
        })
      ).ok,
    ).toBe(true);
    expect((await cambiarEstadoDeCategoria(cliente, creada.datos.id, false)).ok).toBe(true);
    const fila = (await listarCategorias(cliente)).find((c) => c.id === creada.datos.id);
    expect(fila).toMatchObject({ nombre: `${nombre} b`, pide_proveedor: false, activo: false });
  });
});

describe('lo pagado a un proveedor', () => {
  it('suma el mes y el año sin anulados, y cuenta sus recurrentes activos', async () => {
    const proveedorId = await proveedorPropio();
    const categoriaId = await idDeCategoria('Mercadería');
    await gasto({ categoriaId, proveedorId, fecha: '2031-08-03', montoCentavos: 300 });
    await gasto({ categoriaId, proveedorId, fecha: '2031-02-03', montoCentavos: 40 });
    await gasto({ categoriaId, proveedorId, fecha: '2031-08-04', montoCentavos: 9, anulado: true });
    const cliente = await admin();
    expect(await totalesDelProveedor(cliente, proveedorId, '2031-08-20')).toEqual({
      mesCentavos: 300,
      anioCentavos: 340,
    });
    const pagado = await pagadoPorProveedor(cliente, '2031-08-20');
    expect(pagado.get(proveedorId)).toBe(300);
    const { id } = await sembrarRecurrente({
      categoria: 'Mercadería',
      proveedorId,
      primerVencimiento: '2099-01-01',
    });
    recurrentes.push(id);
    expect(await recurrentesActivosDelProveedor(cliente, proveedorId)).toBe(1);
  });
});
