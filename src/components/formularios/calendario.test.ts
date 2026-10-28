import { describe, expect, it } from 'vitest';
import { aFecha, aTexto, ETIQUETAS_DEL_CALENDARIO } from './calendario';

describe('el calendario', () => {
  it('pasa de AAAA-MM-DD a una fecha y vuelve sin correrse de día', () => {
    expect(aTexto(aFecha('2026-03-01'))).toBe('2026-03-01');
    expect(aFecha('2026-10-27').getDate()).toBe(27);
    expect(aTexto(aFecha('2028-02-29'))).toBe('2028-02-29');
  });

  it('nombra cada día como se lee acá y las flechas en castellano', () => {
    expect(ETIQUETAS_DEL_CALENDARIO.labelDayButton(aFecha('2026-11-10'))).toBe('10/11/2026');
    expect(ETIQUETAS_DEL_CALENDARIO.labelNext()).toBe('Mes siguiente');
    expect(ETIQUETAS_DEL_CALENDARIO.labelPrevious()).toBe('Mes anterior');
  });
});
