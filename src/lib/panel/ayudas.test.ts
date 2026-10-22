import { describe, expect, it } from 'vitest';
import { AYUDAS } from './ayudas';

describe('ayudas', () => {
  it('cada ayuda tiene titulo, introduccion y al menos un tema con puntos', () => {
    for (const ayuda of Object.values(AYUDAS)) {
      expect(ayuda.titulo).toMatch(/^Cómo funciona /);
      expect(ayuda.introduccion.length).toBeGreaterThan(0);
      expect(ayuda.temas.length).toBeGreaterThan(0);
      for (const tema of ayuda.temas) expect(tema.puntos.length).toBeGreaterThan(0);
    }
  });

  it('Inicio y Mi cuenta tienen la suya', () => {
    expect(AYUDAS.inicio.titulo).toBe('Cómo funciona Inicio');
    expect(AYUDAS.cuenta.titulo).toBe('Cómo funciona Mi cuenta');
  });
});
