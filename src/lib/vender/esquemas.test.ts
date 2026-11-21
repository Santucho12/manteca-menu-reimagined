import { describe, expect, it } from 'vitest';
import {
  esquemaVentaDelMostrador,
  ventaDelMostradorParaLaBase,
  ventaDelTicket,
  type VentaDelMostrador,
} from './esquemas';

const CLAVE = '9c4f4b3d-5e4a-4f4b-8d9e-4c5d6e7f8091';
const PRODUCTO = '7a2d2f1b-3c2e-4d2f-8b7c-2a3b4c5d6e7f';
const PRESENTACION = '8b3e3a2c-4d3f-4e3a-9c8d-3b4c5d6e7f80';

const CANAL = '6f1c1e0a-2b1d-4c1e-9a6b-1f2e3d4c5b6a';

const venta: VentaDelMostrador = {
  clave: CLAVE,
  renglones: [
    {
      productoId: PRODUCTO,
      presentacionId: PRESENTACION,
      cantidad: 2,
      precioCentavos: 1_800_000,
    },
  ],
  pagos: [
    { medio: 'efectivo', montoCentavos: 1_000_000 },
    { medio: 'debito', montoCentavos: 2_600_000 },
  ],
};

const mensajeDe = (datos: unknown) =>
  esquemaVentaDelMostrador.safeParse(datos).error?.issues[0]?.message;

describe('esquemaVentaDelMostrador', () => {
  it('pasa a la base con los nombres de la base', () => {
    expect(ventaDelMostradorParaLaBase(esquemaVentaDelMostrador.parse(venta))).toEqual({
      clave: CLAVE,
      renglones: [
        {
          producto_id: PRODUCTO,
          presentacion_id: PRESENTACION,
          cantidad: 2,
          precio_centavos: 1_800_000,
        },
      ],
      pagos: [
        { medio: 'efectivo', monto_centavos: 1_000_000 },
        { medio: 'debito', monto_centavos: 2_600_000 },
      ],
    });
  });

  it('sin productos no se cobra', () => {
    expect(mensajeDe({ ...venta, renglones: [] })).toBe('Sumá al menos un producto.');
  });

  it('la cantidad es un entero desde 1', () => {
    for (const cantidad of [0, 1.5, -1]) {
      const renglones = [{ ...venta.renglones[0]!, cantidad }];
      expect(mensajeDe({ ...venta, renglones })).toBe('La cantidad es un número entero, desde 1.');
    }
  });

  it('se cobra con uno o dos medios', () => {
    expect(mensajeDe({ ...venta, pagos: [] })).toBe('Elegí cómo se cobra.');
    const tres = [...venta.pagos, { medio: 'qr', montoCentavos: 1 }];
    expect(mensajeDe({ ...venta, pagos: tres })).toBe('Se cobra con uno o dos medios.');
  });

  it('dos veces el mismo medio se rechaza', () => {
    const pagos = [
      { medio: 'qr', montoCentavos: 1_000_000 },
      { medio: 'qr', montoCentavos: 2_600_000 },
    ];
    expect(mensajeDe({ ...venta, pagos })).toBe('Elegí dos medios distintos.');
  });

  it('cada pago es de más de $0', () => {
    const pagos = [
      { medio: 'efectivo', montoCentavos: 0 },
      { medio: 'debito', montoCentavos: 3_600_000 },
    ];
    expect(mensajeDe({ ...venta, pagos })).toBe('Cada medio lleva más de $0.');
  });

  // Desde el pedido 102 lo controla la base: es la que conoce la docena variada y el peso.
  it('que los pagos sumen el total lo controla la base', () => {
    const pagos = [{ medio: 'efectivo', montoCentavos: 3_500_000 }];
    expect(mensajeDe({ ...venta, pagos })).toBeUndefined();
  });
});

describe('ventaDelTicket', () => {
  it('manda cada renglón con su precio y su cantidad, y los pagos tal cual', () => {
    const ticket = [
      {
        productoId: PRODUCTO,
        presentacionId: PRESENTACION,
        nombre: 'Medialuna',
        presentacion: 'Docena',
        precioCentavos: 1_800_000,
        cantidad: 2,
      },
    ];
    const pagos = [{ medio: 'efectivo' as const, montoCentavos: 3_600_000 }];
    expect(ventaDelTicket(ticket, pagos)).toEqual({
      renglones: [
        {
          productoId: PRODUCTO,
          presentacionId: PRESENTACION,
          cantidad: 2,
          precioCentavos: 1_800_000,
        },
      ],
      pagos,
    });
  });
});

describe('el tipo de venta y Fuera de la caja (pedido 99)', () => {
  it('sin tipo no manda canal; con tipo, lo manda', () => {
    expect(ventaDelMostradorParaLaBase(esquemaVentaDelMostrador.parse(venta))).not.toHaveProperty(
      'canal_id',
    );
    const conTipo = esquemaVentaDelMostrador.parse({ ...venta, canalId: CANAL });
    expect(ventaDelMostradorParaLaBase(conTipo)).toMatchObject({ canal_id: CANAL });
  });

  // Santiago lo sacó (2026-11-20, pedido 102): en el mostrador se cobra solo con los medios de la caja.
  it('ya no acepta cobrar Fuera de la caja', () => {
    const pagos = venta.pagos.map((p, i) => (i === 0 ? { ...p, medio: 'fuera_de_caja' } : p));
    expect(esquemaVentaDelMostrador.safeParse({ ...venta, pagos }).success).toBe(false);
  });
});
