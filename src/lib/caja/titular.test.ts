import { describe, expect, it } from 'vitest';
import { explicacionDelCierre, titularDelCierre } from './titular';

describe('titularDelCierre', () => {
  it('un cierre sin diferencia dice que cierra', () => {
    expect(titularDelCierre({ estado: 'cierra', anulado: false }, 0)).toBe('La caja cierra');
  });

  it('con diferencia dice cuanto falta o sobra en total', () => {
    expect(titularDelCierre({ estado: 'con_diferencia', anulado: false }, -100000)).toBe(
      'Faltan $1.000,00 en total',
    );
    expect(titularDelCierre({ estado: 'con_diferencia', anulado: false }, 250000)).toBe(
      'Sobran $2.500,00 en total',
    );
  });

  it('un cierre sin las ventas del dia cargadas las espera', () => {
    expect(titularDelCierre({ estado: 'esperando_ventas', anulado: false }, 0)).toBe(
      'Esperando las ventas del día',
    );
  });

  it('uno anulado se dice anulado, sea cual sea su resultado', () => {
    expect(titularDelCierre({ estado: 'con_diferencia', anulado: true }, -5)).toBe(
      'Cierre anulado',
    );
  });
});

describe('explicacionDelCierre', () => {
  it('a un cierre que espera las ventas le dice cuando va a tener resultado', () => {
    expect(explicacionDelCierre({ estado: 'esperando_ventas', anulado: false })).toBe(
      'Guardado. El resultado va a estar cuando se carguen las ventas del día.',
    );
  });

  it('a los demas no les agrega nada', () => {
    expect(explicacionDelCierre({ estado: 'cierra', anulado: false })).toBeNull();
    expect(explicacionDelCierre({ estado: 'esperando_ventas', anulado: true })).toBeNull();
  });
});
