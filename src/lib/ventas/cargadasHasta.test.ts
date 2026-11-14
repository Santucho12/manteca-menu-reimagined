import { describe, expect, it } from 'vitest';
import { textoDeCargadasHasta } from './cargadasHasta';

describe('textoDeCargadasHasta', () => {
  it('dice hasta que dia hay ventas y avisa si quedo atras', () => {
    expect(textoDeCargadasHasta('2026-10-28', '2026-11-05')).toEqual({
      texto: 'Ventas de Fudo cargadas hasta el 28/10',
      atrasado: true,
    });
  });

  it('hasta ayer esta al dia', () => {
    expect(textoDeCargadasHasta('2026-11-04', '2026-11-05')).toEqual({
      texto: 'Ventas de Fudo cargadas hasta el 04/11',
      atrasado: false,
    });
  });

  it('de otro año lo dice con el año', () => {
    expect(textoDeCargadasHasta('2025-12-30', '2026-01-10').texto).toBe(
      'Ventas de Fudo cargadas hasta el 30/12/2025',
    );
  });

  it('sin ninguna venta de Fudo lo dice', () => {
    expect(textoDeCargadasHasta(null, '2026-11-05')).toEqual({
      texto: 'Todavía no se subieron ventas de Fudo',
      atrasado: true,
    });
  });
});
