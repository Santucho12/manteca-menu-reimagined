import { describe, expect, it } from 'vitest';
import { esquemaDeAjustes } from './ajustes';

describe('los ajustes de caja se guardan juntos (Santiago, 2026-11-20)', () => {
  it('pide horas en orden y la tolerancia', () => {
    expect(
      esquemaDeAjustes.safeParse({ mediodia: '15:00', noche: '23:00', tolerancia: '500' }).success,
    ).toBe(true);
    const mal = esquemaDeAjustes.safeParse({ mediodia: '23:30', noche: '23:00', tolerancia: '' });
    expect(mal.success).toBe(false);
    const caminos = mal.error?.issues.map((i) => i.path[0]);
    expect(caminos).toEqual(expect.arrayContaining(['mediodia', 'tolerancia']));
  });
});
