import { describe, expect, it } from 'vitest';
import { gastosPorCategoria, puntosDeGastos, totalDeGastos } from './gastos';

const filas = [
  { dia: '2026-10-01', categoria_id: 'a', categoria: 'Alquiler', monto_centavos: 100000 },
  { dia: '2026-10-01', categoria_id: 'b', categoria: 'Mercadería', monto_centavos: 50000 },
  { dia: '2026-10-03', categoria_id: 'b', categoria: 'Mercadería', monto_centavos: 80000 },
];

describe('gastos del reporte', () => {
  it('suma por categoria, de la mas grande a la mas chica', () => {
    expect(gastosPorCategoria(filas)).toEqual([
      { clave: 'b', nombre: 'Mercadería', montoCentavos: 130000 },
      { clave: 'a', nombre: 'Alquiler', montoCentavos: 100000 },
    ]);
  });

  it('suma por dia y en total', () => {
    expect(puntosDeGastos(filas)).toEqual([
      { clave: '2026-10-01', montoCentavos: 150000, cantidad: 0 },
      { clave: '2026-10-03', montoCentavos: 80000, cantidad: 0 },
    ]);
    expect(totalDeGastos(filas)).toBe(230000);
  });
});
