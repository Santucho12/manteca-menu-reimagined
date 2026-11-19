import { describe, expect, it } from 'vitest';
import {
  esquemaAnulacionDeVenta,
  esquemaCanal,
  esquemaVenta,
  ventaParaLaBase,
  type DatosDeVenta,
} from './esquemas';

const CANAL = '6f1c1e0a-2b1d-4c1e-9a6b-1f2e3d4c5b6a';
const PRODUCTO = '7a2d2f1b-3c2e-4d2f-8b7c-2a3b4c5d6e7f';
const PRESENTACION = '8b3e3a2c-4d3f-4e3a-9c8d-3b4c5d6e7f80';

const CLAVE = '9c4f4b3d-5e4a-4f4b-8d9e-4c5d6e7f8091';

const venta: DatosDeVenta = {
  clave: CLAVE,
  fecha: '2026-10-10',
  canalId: CANAL,
  medio: 'transferencia',
  comentario: '  ',
  enLaCaja: true,
  turno: '1',
  renglones: [
    { opcion: `${PRODUCTO}|${PRESENTACION}`, cantidad: '1,5', precio: '3.333,33' },
    { opcion: `${PRODUCTO}|${PRESENTACION}`, cantidad: '2', precio: '1.000' },
  ],
};

describe('esquemaVenta', () => {
  it('pasa a la base con cantidades y precios en numeros', () => {
    expect(ventaParaLaBase(esquemaVenta.parse(venta))).toEqual({
      clave: CLAVE,
      fecha: '2026-10-10',
      canal_id: CANAL,
      medio: 'transferencia',
      comentario: null,
      en_la_caja: true,
      turno: 1,
      renglones: [
        {
          producto_id: PRODUCTO,
          presentacion_id: PRESENTACION,
          cantidad: 1.5,
          precio_unitario_centavos: 333333,
        },
        {
          producto_id: PRODUCTO,
          presentacion_id: PRESENTACION,
          cantidad: 2,
          precio_unitario_centavos: 100000,
        },
      ],
    });
  });

  it('cobrada en la caja o no, guarda el turno elegido', () => {
    expect(ventaParaLaBase(esquemaVenta.parse({ ...venta, turno: '1' })).turno).toBe(1);
    expect(ventaParaLaBase(esquemaVenta.parse({ ...venta, enLaCaja: false })).turno).toBe(1);
    expect(esquemaVenta.safeParse({ ...venta, turno: '0' }).success).toBe(false);
  });

  it('dice si se cobró en la caja del local, y sin marcar es que no', () => {
    expect(esquemaVenta.parse({ ...venta, enLaCaja: false }).enLaCaja).toBe(false);
    expect(esquemaVenta.safeParse({ ...venta, enLaCaja: 'si' }).success).toBe(false);
  });

  it('pide al menos un producto, canal y medio de pago', () => {
    expect(esquemaVenta.safeParse({ ...venta, renglones: [] }).error?.issues[0]?.message).toBe(
      'Sumá al menos un producto.',
    );
    expect(esquemaVenta.safeParse({ ...venta, canalId: '' }).success).toBe(false);
    expect(esquemaVenta.safeParse({ ...venta, medio: 'cheque' }).success).toBe(false);
  });

  it('explica una cantidad o un precio mal escritos y un producto sin elegir', () => {
    const renglon = venta.renglones[0]!;
    const conCantidad = esquemaVenta.safeParse({
      ...venta,
      renglones: [{ ...renglon, cantidad: '0' }],
    });
    expect(conCantidad.error?.issues[0]?.message).toBe(
      'Escribí la cantidad, con coma para los decimales: 1,5.',
    );
    expect(
      esquemaVenta.safeParse({ ...venta, renglones: [{ ...renglon, precio: '12,345' }] }).success,
    ).toBe(false);
    const sinProducto = esquemaVenta.safeParse({
      ...venta,
      renglones: [{ ...renglon, opcion: '' }],
    });
    expect(sinProducto.error?.issues[0]?.message).toBe('Elegí el producto.');
  });
});

describe('otros esquemas', () => {
  it('anular pide motivo; un canal pide nombre', () => {
    expect(esquemaAnulacionDeVenta.safeParse({ id: CANAL, motivo: ' ' }).success).toBe(false);
    expect(esquemaCanal.safeParse({ nombre: '' }).success).toBe(false);
    expect(esquemaCanal.parse({ nombre: ' Feria ' }).nombre).toBe('Feria');
  });
});

describe('la venta a mano lleva turno siempre (pedido 99)', () => {
  it('aunque no se haya cobrado en la caja, y acepta Fuera de la caja', () => {
    const datos = esquemaVenta.parse({
      ...venta,
      enLaCaja: false,
      turno: '1',
      medio: 'fuera_de_caja',
    });
    expect(ventaParaLaBase(datos)).toMatchObject({ turno: 1, medio: 'fuera_de_caja' });
  });
});
