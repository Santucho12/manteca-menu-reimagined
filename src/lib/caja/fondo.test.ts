import { describe, expect, it } from 'vitest';
import { diferenciaDeFondo, textoDeFondo, totalDeRetiros } from './fondo';

describe('fondo de la caja', () => {
  it('compara el fondo con lo que quedo en el cierre anterior', () => {
    expect(diferenciaDeFondo(1000000, 1500000)).toBe(-500000);
    expect(diferenciaDeFondo(1000000, 1000000)).toBe(0);
    expect(diferenciaDeFondo(1000000, null)).toBeNull();
  });

  it('lo dice en palabras', () => {
    expect(textoDeFondo(-500000)).toBe(
      'Arrancó con $5.000,00 menos de lo que quedó en el cierre anterior.',
    );
    expect(textoDeFondo(120050)).toBe(
      'Arrancó con $1.200,50 más de lo que quedó en el cierre anterior.',
    );
  });

  it('suma los retiros', () => {
    expect(totalDeRetiros([{ monto_centavos: 500000 }, { monto_centavos: 1 }])).toBe(500001);
    expect(totalDeRetiros([])).toBe(0);
  });
});
