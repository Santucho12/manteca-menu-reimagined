import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { diaEnArgentina } from '../../src/lib/fechas';
import { listarVentas } from '../../src/lib/ventas/consultas';
import { clienteComo } from '../sesiones';
import {
  borrarVentas,
  datosDeVenta,
  idDeCanal,
  productoParaVender,
  sembrarVenta,
  type ParaVender,
} from '../ventas-de-prueba';

const HOY = diaEnArgentina(new Date());
const ventas: string[] = [];
const categoriasDelMenu: string[] = [];
let producto: ParaVender;

beforeAll(async () => {
  producto = await productoParaVender();
  categoriasDelMenu.push(producto.categoriaId);
});

afterAll(() => borrarVentas(ventas, { categoriasDelMenu }));

const filtros = {
  desde: HOY,
  hasta: HOY,
  origen: null,
  medio: null,
  estado: null,
  pagina: 1,
} as const;

describe('quien cargo cada venta', () => {
  it('la lista dice el nombre de quien cargo una venta a mano, y nada si nadie la cargo', async () => {
    const admin = await clienteComo('admin');
    const canal = await idDeCanal('Cheaf');
    const renglones = [{ producto, cantidad: 1, precioCentavos: 777700 }];
    const { data: id } = await admin.rpc('ventas_guardar_manual', {
      datos: datosDeVenta(HOY, canal, renglones),
    });
    ventas.push(id!);
    const sinAutor = await sembrarVenta({ fecha: HOY });
    ventas.push(sinAutor.id);
    const lista = await listarVentas(admin, { ...filtros, origen: null });
    const cargada = lista.filas.find((fila) => fila.id === id);
    expect(cargada?.cargada_por).toBe('Prueba Admin');
    expect(lista.filas.find((fila) => fila.id === sinAutor.id)?.cargada_por).toBeNull();
  });
});
