import { describe, expect, it } from 'vitest';
import { resultadoDelPeriodo } from '../reportes/resultado';
import { numerosDelMes } from './numeros';

const venta = (dia: string, monto_centavos: number, ventas = 1) => ({
  dia,
  ventas,
  monto_centavos,
});
const gasto = (monto_centavos: number) => ({
  dia: '2026-10-02',
  categoria_id: 'a',
  categoria: 'Alquiler',
  monto_centavos,
});

function datos(ventas: ReturnType<typeof venta>[], gastos: ReturnType<typeof gasto>[]) {
  return {
    ventas,
    gastos,
    resultado: resultadoDelPeriodo(ventas, gastos),
    vacio: ventas.length === 0 && gastos.length === 0,
  };
}

describe('numerosDelMes', () => {
  it('muestra ventas, gastos, resultado y ticket con su variacion', () => {
    const actual = datos([venta('2026-10-01', 400000, 2)], [gasto(100000)]);
    const anterior = datos([venta('2026-09-01', 200000, 2)], [gasto(50000)]);
    expect(numerosDelMes(actual, anterior)).toEqual([
      {
        etiqueta: 'Ventas',
        valor: '$4.000,00',
        variacion: { diferenciaCentavos: 200000, porcentaje: 100 },
      },
      {
        etiqueta: 'Gastos',
        valor: '$1.000,00',
        variacion: { diferenciaCentavos: 50000, porcentaje: 100 },
      },
      {
        etiqueta: 'Balance',
        valor: '$3.000,00',
        variacion: { diferenciaCentavos: 150000, porcentaje: 100 },
      },
      {
        etiqueta: 'Ticket promedio',
        valor: '$2.000,00',
        variacion: { diferenciaCentavos: 100000, porcentaje: 100 },
      },
    ]);
  });

  it('sin gastos no calcula el resultado, y sin el mes anterior no compara', () => {
    const numeros = numerosDelMes(datos([venta('2026-10-01', 100)], []), datos([], []));
    expect(numeros.map((n) => n.valor)).toEqual(['$1,00', '$0,00', 'Sin calcular', '$1,00']);
    expect(numeros.map((n) => n.variacion)).toEqual([null, null, null, null]);
  });

  it('un mes sin ventas da todo en cero sin romper', () => {
    const numeros = numerosDelMes(datos([], []), datos([], []));
    expect(numeros.map((n) => n.valor)).toEqual(['$0,00', '$0,00', 'Sin calcular', '$0,00']);
  });
});
