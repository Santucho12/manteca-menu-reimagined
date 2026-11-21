import { describe, expect, it } from 'vitest';
import { porcionDelResultado, textoDeLaPorcion, textoDeVentasDelMes } from './bloqueDelMes';

const r = (ventasCentavos: number, gastosCentavos: number, resultadoCentavos: number | null) => ({
  ventasCentavos,
  gastosCentavos,
  resultadoCentavos,
  categorias: [],
});

describe('porcionDelResultado', () => {
  it('es el resultado sobre las ventas, redondeado', () =>
    expect(porcionDelResultado(r(1000000, 450000, 550000))).toBe(55));
  it('sin resultado calculado no hay porcion', () =>
    expect(porcionDelResultado(r(1000000, 0, null))).toBeNull());
  it('sin ventas no hay porcion', () => expect(porcionDelResultado(r(0, 100, -100))).toBeNull());
  it('con perdida queda en cero', () => expect(porcionDelResultado(r(1000, 3000, -2000))).toBe(0));
});

describe('textoDeLaPorcion', () => {
  it('dice cuanto queda de cada peso', () =>
    expect(textoDeLaPorcion(55)).toBe(
      'Después de pagar los gastos, te queda el 55% de lo que vendiste',
    ));
  it('sin porcion dice sin calcular', () => expect(textoDeLaPorcion(null)).toBe('Sin calcular'));
});

describe('textoDeVentasDelMes', () => {
  it('una venta va en singular', () =>
    expect(textoDeVentasDelMes(1)).toBe('Del 1 a hoy · 1 venta'));
  it('varias van en plural', () =>
    expect(textoDeVentasDelMes(569)).toBe('Del 1 a hoy · 569 ventas'));
});
