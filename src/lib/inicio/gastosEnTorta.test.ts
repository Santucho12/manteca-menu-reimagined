import { describe, expect, it } from 'vitest';
import type { GastoDelDia } from '../reportes/gastos';
import { rebanadasDeGastos } from './gastosEnTorta';

const gasto = (categoria: string, monto: number): GastoDelDia => ({
  dia: '2026-10-05',
  categoria_id: categoria,
  categoria,
  monto_centavos: monto,
});

describe('rebanadasDeGastos', () => {
  it('sin gastos no hay rebanadas', () => {
    expect(rebanadasDeGastos([])).toEqual([]);
    expect(rebanadasDeGastos([gasto('Luz', 0)])).toEqual([]);
  });

  it('junta los gastos de cada categoria, de la mayor a la menor, con su porcentaje', () => {
    const filas = [gasto('Luz', 100), gasto('Mercadería', 600), gasto('Luz', 100)];
    expect(rebanadasDeGastos(filas)).toEqual([
      { clave: 'Mercadería', nombre: 'Mercadería', montoCentavos: 600, porcentaje: 75 },
      { clave: 'Luz', nombre: 'Luz', montoCentavos: 200, porcentaje: 25 },
    ]);
  });

  it('con mas de cinco categorias, las ultimas se juntan en Otras', () => {
    const filas = [60, 50, 40, 30, 20, 10].map((monto, i) => gasto(`c${i}`, monto));
    const rebanadas = rebanadasDeGastos(filas);
    expect(rebanadas.map((r) => r.nombre)).toEqual(['c0', 'c1', 'c2', 'c3', 'Otras']);
    expect(rebanadas[4]).toMatchObject({ montoCentavos: 30, porcentaje: 14.3 });
  });

  it('con exactamente cinco categorias no junta nada', () => {
    const filas = [5, 4, 3, 2, 1].map((monto, i) => gasto(`c${i}`, monto));
    expect(rebanadasDeGastos(filas)).toHaveLength(5);
  });
});
