import { describe, expect, it } from 'vitest';
import { pagosDelCobro, vueltoDe } from './pagos';

describe('pagosDelCobro', () => {
  it('con un medio, todo el total va con ese medio', () => {
    expect(pagosDelCobro(2_150_000, { medio: 'debito' })).toEqual({
      ok: true,
      datos: [{ medio: 'debito', montoCentavos: 2_150_000 }],
    });
  });

  it('con dos medios, el primero lleva lo escrito y el segundo el resto', () => {
    const cobro = {
      medio: 'efectivo',
      segundoMedio: 'qr',
      montoDelPrimeroCentavos: 500_000,
    } as const;
    expect(pagosDelCobro(2_150_000, cobro)).toEqual({
      ok: true,
      datos: [
        { medio: 'efectivo', montoCentavos: 500_000 },
        { medio: 'qr', montoCentavos: 1_650_000 },
      ],
    });
  });

  it('dos veces el mismo medio no es pagar con dos', () => {
    const cobro = { medio: 'qr', segundoMedio: 'qr', montoDelPrimeroCentavos: 100_000 } as const;
    expect(pagosDelCobro(500_000, cobro)).toEqual({
      ok: false,
      mensaje: 'Elegí dos medios distintos.',
    });
  });

  it('con el primer medio va una parte: ni $0 ni el total entero', () => {
    const mensaje = 'Con el primer medio va una parte: más de $0 y menos de $5.000,00.';
    for (const monto of [0, 500_000, 600_000]) {
      const cobro = {
        medio: 'efectivo',
        segundoMedio: 'debito',
        montoDelPrimeroCentavos: monto,
      } as const;
      expect(pagosDelCobro(500_000, cobro)).toEqual({ ok: false, mensaje });
    }
  });

  it('un ticket vacío no se cobra', () => {
    expect(pagosDelCobro(0, { medio: 'efectivo' })).toEqual({
      ok: false,
      mensaje: 'Sumá al menos un producto.',
    });
  });
});

describe('vueltoDe', () => {
  it('es lo que paga el cliente menos lo que va en efectivo', () => {
    const pagos = [{ medio: 'efectivo', montoCentavos: 1_750_000 }] as const;
    expect(vueltoDe([...pagos], 2_000_000)).toEqual({ ok: true, datos: 250_000 });
  });

  it('con dos medios, cuenta solo la parte en efectivo', () => {
    const pagos = [
      { medio: 'debito', montoCentavos: 1_000_000 },
      { medio: 'efectivo', montoCentavos: 300_000 },
    ] as const;
    expect(vueltoDe([...pagos], 500_000)).toEqual({ ok: true, datos: 200_000 });
  });

  it('si no alcanza, dice cuánto falta', () => {
    const pagos = [{ medio: 'efectivo', montoCentavos: 1_750_000 }] as const;
    expect(vueltoDe([...pagos], 1_000_000)).toEqual({
      ok: false,
      mensaje: 'Con eso no alcanza: faltan $7.500,00.',
    });
  });
});
