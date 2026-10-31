import { describe, expect, it } from 'vitest';
import { fondosAnterioresDe, type CierreParaFondo } from './fondosAnteriores';

const cierre = (id: string, fecha: string, quedaEnCaja: number, anulado = false) =>
  ({ id, fecha, anulado, queda_en_caja_centavos: quedaEnCaja }) satisfies CierreParaFondo;

describe('fondosAnterioresDe', () => {
  it('el primero del rango toma lo que quedó antes del rango', () => {
    const fondos = fondosAnterioresDe([cierre('a', '2026-10-01', 100)], 50);
    expect(fondos.get('a')).toBe(50);
  });

  it('cada cierre toma lo que quedó en el anterior', () => {
    const cierres = [
      cierre('a', '2026-10-01', 100),
      cierre('b', '2026-10-02', 200),
      cierre('c', '2026-10-03', 300),
    ];
    expect(Object.fromEntries(fondosAnterioresDe(cierres, 50))).toEqual({ a: 50, b: 100, c: 200 });
  });

  it('un cierre anulado no cuenta como anterior', () => {
    const cierres = [
      cierre('a', '2026-10-01', 100),
      cierre('b', '2026-10-02', 999, true),
      cierre('c', '2026-10-03', 300),
    ];
    expect(fondosAnterioresDe(cierres, 50).get('c')).toBe(100);
  });

  it('uno del mismo día no es anterior', () => {
    const cierres = [cierre('a', '2026-10-02', 100, true), cierre('b', '2026-10-02', 200)];
    expect(Object.fromEntries(fondosAnterioresDe(cierres, 50))).toEqual({ a: 50, b: 50 });
  });

  it('un anulado también tiene su fondo anterior', () => {
    const cierres = [cierre('a', '2026-10-01', 100), cierre('b', '2026-10-02', 999, true)];
    expect(fondosAnterioresDe(cierres, 50).get('b')).toBe(100);
  });

  it('sin nada antes, el primero queda en null', () => {
    const cierres = [cierre('a', '2026-10-01', 100), cierre('b', '2026-10-02', 0)];
    expect(Object.fromEntries(fondosAnterioresDe(cierres, null))).toEqual({ a: null, b: 100 });
  });

  it('lo que quedó en cero también cuenta como fondo', () => {
    const cierres = [cierre('a', '2026-10-01', 0), cierre('b', '2026-10-02', 200)];
    expect(fondosAnterioresDe(cierres, 50).get('b')).toBe(0);
  });

  it('no importa el orden en que lleguen', () => {
    const cierres = [
      cierre('c', '2026-10-03', 300),
      cierre('a', '2026-10-01', 100),
      cierre('b', '2026-10-02', 200),
    ];
    expect(Object.fromEntries(fondosAnterioresDe(cierres, 50))).toEqual({ a: 50, b: 100, c: 200 });
  });
});
