import { describe, expect, it } from 'vitest';
import {
  ALFABETO_TEMPORAL,
  LARGO_TEMPORAL,
  contrasenaTemporal,
  crearContrasenaTemporal,
} from './contrasenas';

describe('contraseñas temporales', () => {
  it('usa un caracter del alfabeto por cada valor al azar', () => {
    expect(contrasenaTemporal(Uint32Array.from({ length: 12 }, (_, i) => i))).toBe('ABCDEFGHJKLM');
  });

  it('con valores grandes vuelve a empezar el alfabeto', () => {
    const azar = Uint32Array.from({ length: 12 }, () => ALFABETO_TEMPORAL.length + 1);
    expect(contrasenaTemporal(azar)).toBe('B'.repeat(12));
  });

  it('pide al menos doce valores', () => {
    expect(() => contrasenaTemporal(new Uint32Array(11))).toThrow('Hacen falta 12');
  });

  it('la contraseña nueva tiene doce caracteres sin los que se confunden', () => {
    const temporal = crearContrasenaTemporal();
    expect(temporal).toHaveLength(LARGO_TEMPORAL);
    expect(temporal).toMatch(/^[A-HJ-NP-Za-km-np-z2-9]{12}$/);
  });

  it('dos contraseñas nuevas no salen iguales', () => {
    expect(crearContrasenaTemporal()).not.toBe(crearContrasenaTemporal());
  });
});
