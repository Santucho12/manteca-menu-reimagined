import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { diaEnArgentina } from '../../src/lib/fechas';
import { diaLibre } from '../cierres-de-prueba';
import { clienteComo } from '../sesiones';
import {
  canalesDeVenta,
  listarVentas,
  opcionesParaVender,
  ventaPorId,
} from '../../src/lib/ventas/consultas';
import {
  anularVenta,
  cambiarEstadoDeCanal,
  crearCanal,
  editarCanal,
  guardarVenta,
  MENSAJES_DE_VENTAS,
} from '../../src/lib/ventas/escritura';
import type { DatosDeVenta } from '../../src/lib/ventas/esquemas';
import type { FiltrosDeVentas } from '../../src/lib/ventas/pantalla';
import {
  borrarVentas,
  idDeCanal,
  productoParaVender,
  sembrarVenta,
  type ParaVender,
} from '../ventas-de-prueba';

const HOY = diaEnArgentina(new Date());
const ventas: string[] = [];
const canales: string[] = [];
const categoriasDelMenu: string[] = [];
let producto: ParaVender;
let encargo: string;

beforeAll(async () => {
  producto = await productoParaVender();
  categoriasDelMenu.push(producto.categoriaId);
  encargo = await idDeCanal('Encargo');
});

afterAll(() => borrarVentas(ventas, { canales, categoriasDelMenu }));

const datos = (fecha: string, cambios: Partial<DatosDeVenta> = {}): DatosDeVenta => ({
  clave: crypto.randomUUID(),
  fecha,
  canalId: encargo,
  medio: 'transferencia',
  comentario: 'Encargo de la escuela',
  renglones: [
    {
      opcion: `${producto.productoId}|${producto.presentacionId}`,
      cantidad: '2',
      precio: '1.500',
    },
  ],
  ...cambios,
});

async function guardar(fecha: string, cambios: Partial<DatosDeVenta> = {}) {
  const resultado = await guardarVenta(await clienteComo('admin'), datos(fecha, cambios));
  if (!resultado.ok) throw new Error(resultado.mensaje);
  ventas.push(resultado.datos.id);
  return resultado.datos.id;
}

const filtros = (fecha: string, cambios: Partial<FiltrosDeVentas> = {}): FiltrosDeVentas => ({
  desde: fecha,
  hasta: fecha,
  origen: null,
  medio: null,
  estado: null,
  pagina: 1,
  ...cambios,
});

describe('guardar y leer una venta a mano', () => {
  it('la guarda y la lee con sus renglones, su pago y su canal', async () => {
    const id = await guardar(HOY);
    expect(await ventaPorId(await clienteComo('admin'), id)).toMatchObject({
      origen: 'manual',
      total_centavos: 300000,
      canal: 'Encargo',
      comentario: 'Encargo de la escuela',
      renglones: [expect.objectContaining({ cantidad: 2, subtotal_centavos: 300000 })],
      pagos: [{ medio: 'transferencia', monto_centavos: 300000 }],
    });
  });

  it('explica el dia futuro y el canal que no esta', async () => {
    const admin = await clienteComo('admin');
    const futuro = '2099-01-01';
    expect(await guardarVenta(admin, datos(futuro))).toEqual({
      ok: false,
      mensaje: MENSAJES_DE_VENTAS.diaFuturo,
    });
    const caja = await guardarVenta(await clienteComo('caja'), datos(HOY));
    expect(caja).toEqual({ ok: false, mensaje: MENSAJES_DE_VENTAS.sinPermiso });
  });

  it('un id que no sirve no es una venta', async () => {
    expect(await ventaPorId(await clienteComo('admin'), 'abc')).toBeNull();
  });
});

describe('lista y totales', () => {
  it('filtra por dia, medio y estado, y el total no cuenta lo anulado', async () => {
    const dia = diaLibre();
    const efectivo = await guardar(dia, { medio: 'efectivo' });
    await guardar(dia, { medio: 'qr' });
    const anulada = await guardar(dia, { medio: 'qr' });
    const admin = await clienteComo('admin');
    expect((await anularVenta(admin, anulada, 'Duplicada')).ok).toBe(true);
    const todo = await listarVentas(admin, filtros(dia));
    expect(todo.filas).toHaveLength(3);
    expect(todo.totales).toMatchObject({
      cobradoCentavos: 600000,
      cobradas: 2,
      anuladoCentavos: 300000,
      anuladas: 1,
    });
    const conQr = await listarVentas(admin, filtros(dia, { medio: 'qr' }));
    expect(conQr.totales.cobradoCentavos).toBe(300000);
    const anuladas = await listarVentas(admin, filtros(dia, { estado: 'anulada' }));
    expect(anuladas.filas.map((f) => f.id)).toEqual([anulada]);
    const cerradas = await listarVentas(admin, filtros(dia, { estado: 'cerrada' }));
    expect(cerradas.filas.map((f) => f.id)).toContain(efectivo);
    expect(cerradas.filas.map((f) => f.id)).not.toContain(anulada);
  });

  it('una venta de Fudo no se anula y se explica', async () => {
    const deFudo = await sembrarVenta({ origen: 'fudo' });
    ventas.push(deFudo.id);
    expect(await anularVenta(await clienteComo('admin'), deFudo.id, 'x')).toEqual({
      ok: false,
      mensaje: MENSAJES_DE_VENTAS.deFudo,
    });
  });

  it('caja no ve ventas', async () => {
    const { filas } = await listarVentas(await clienteComo('caja'), filtros(HOY));
    expect(filas).toEqual([]);
  });
});

describe('opciones y canales', () => {
  it('ofrece el producto con su presentacion y su precio', async () => {
    const opciones = await opcionesParaVender(await clienteComo('admin'));
    const opcion = opciones.find(
      (o) => o.valor === `${producto.productoId}|${producto.presentacionId}`,
    );
    expect(opcion?.precioCentavos).toBe(100000);
  });

  it('suma, renombra y desactiva un canal, y no repite un nombre', async () => {
    const admin = await clienteComo('admin');
    expect(await crearCanal(admin, { nombre: 'cheaf' })).toEqual({
      ok: false,
      mensaje: MENSAJES_DE_VENTAS.canalRepetido,
    });
    const nombre = `Feria ${Date.now()}`;
    const creado = await crearCanal(admin, { nombre });
    if (!creado.ok) throw new Error(creado.mensaje);
    canales.push(creado.datos.id);
    expect((await editarCanal(admin, creado.datos.id, { nombre: `${nombre} b` })).ok).toBe(true);
    expect((await cambiarEstadoDeCanal(admin, creado.datos.id, false)).ok).toBe(true);
    const fila = (await canalesDeVenta(admin)).find((c) => c.id === creado.datos.id);
    expect(fila).toMatchObject({ nombre: `${nombre} b`, activo: false });
  });
});
