import { describe, expect, it } from 'vitest';
import type { Medio } from '../../src/lib/caja/resultado';
import { crearAzar } from './azar';
import { cierreCuadrado, cierreDelDia, FONDO_CENTAVOS, vendidoPorMedio } from './cierres';
import type { VentaDeEjemplo } from './ventas';

const DIA = '2026-11-17';
const venta = (pagos: [Medio, number][]): VentaDeEjemplo => ({
  fecha: DIA,
  cerradaEn: `${DIA}T15:00:00.000Z`,
  renglones: [],
  pagos: pagos.map(([medio, montoCentavos]) => ({ medio, montoCentavos })),
  totalCentavos: pagos.reduce((s, [, monto]) => s + monto, 0),
});

const ventas = [
  venta([['efectivo', 3000000]]),
  venta([
    ['efectivo', 1000000],
    ['debito', 2500000],
  ]),
  venta([['qr', 800000]]),
];

describe('vendidoPorMedio', () => {
  it('suma cada pago en su medio, también los de las ventas con dos', () => {
    expect(vendidoPorMedio(ventas)).toEqual({
      efectivo: 4000000,
      credito: 0,
      debito: 2500000,
      qr: 800000,
      transferencia: 0,
    });
  });
});

describe('cierreCuadrado', () => {
  it('declara lo que tiene que haber: el fondo más el efectivo vendido, menos el gasto', () => {
    const gastos = [{ monto_centavos: 500000, descripcion: 'Hielo' }];
    expect(cierreCuadrado(DIA, ventas, gastos)).toMatchObject({
      fecha: DIA,
      fondo_inicial_centavos: FONDO_CENTAVOS,
      efectivo_centavos: FONDO_CENTAVOS + 4000000 - 500000,
      debito_centavos: 2500000,
      qr_centavos: 800000,
      queda_en_caja_centavos: FONDO_CENTAVOS,
      retiros: [],
      gastos,
    });
  });

  it('con mucho efectivo el dueño retira de a diez mil y queda el fondo con el resto', () => {
    const cierre = cierreCuadrado(DIA, [venta([['efectivo', 12345600]])], []);
    expect(cierre.retiros).toEqual([{ monto_centavos: 12000000, quien: 'Dueño' }]);
    expect(cierre.efectivo_centavos).toBe(FONDO_CENTAVOS + 345600);
  });
});

describe('cierreDelDia', () => {
  it('casi siempre cierra con poca diferencia, y alguno no cierra', () => {
    const diferencias = Array.from({ length: 40 }, (_, i) => {
      const cierre = cierreDelDia(crearAzar(i), DIA, ventas);
      return (
        cierre.efectivo_centavos - cierreCuadrado(DIA, ventas, cierre.gastos).efectivo_centavos
      );
    });
    const chicas = diferencias.filter((d) => Math.abs(d) <= 50000);
    expect(chicas.length).toBeGreaterThan(30);
    expect(diferencias.some((d) => Math.abs(d) > 50000)).toBe(true);
  });

  it('nunca deja en la caja más de lo que contó', () => {
    for (let i = 0; i < 40; i += 1) {
      const cierre = cierreDelDia(crearAzar(i), DIA, [venta([['qr', 100000]])]);
      expect(cierre.queda_en_caja_centavos).toBeLessThanOrEqual(cierre.efectivo_centavos);
      expect(cierre.efectivo_centavos).toBeGreaterThanOrEqual(0);
    }
  });
});
