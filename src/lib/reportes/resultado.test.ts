import { describe, expect, it } from 'vitest';
import { resultadoDelPeriodo, resultadoPorMes } from './resultado';

const ventas = [
  { dia: '2026-09-10', ventas: 1, monto_centavos: 500000 },
  { dia: '2026-10-05', ventas: 2, monto_centavos: 300000 },
];
const gastos = [
  { dia: '2026-10-01', categoria_id: 'a', categoria: 'Alquiler', monto_centavos: 100000 },
];

describe('resultado', () => {
  it('es ventas menos gastos, con los gastos por categoria', () => {
    expect(resultadoDelPeriodo(ventas, gastos)).toEqual({
      ventasCentavos: 800000,
      gastosCentavos: 100000,
      resultadoCentavos: 700000,
      categorias: [{ clave: 'a', nombre: 'Alquiler', montoCentavos: 100000 }],
    });
  });

  it('sin gastos cargados no calcula el resultado', () => {
    expect(resultadoDelPeriodo(ventas, []).resultadoCentavos).toBeNull();
  });

  it('por mes, el mes sin gastos queda solo con ventas', () => {
    expect(resultadoPorMes(ventas, gastos)).toEqual([
      { mes: '2026-09', ventasCentavos: 500000, gastosCentavos: 0, resultadoCentavos: null },
      { mes: '2026-10', ventasCentavos: 300000, gastosCentavos: 100000, resultadoCentavos: 200000 },
    ]);
  });
});
