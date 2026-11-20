import { describe, expect, it } from 'vitest';
import { COLORES_DE_LA_SEMANA } from './coloresDeInicio';

// Inicio con menos colores (Santiago, 2026-11-19, pedido 102): verde lo que entra, rojo lo que
// sale o urge, azul el balance y lo actual, gris lo neutro o de referencia.
describe('los colores de los gráficos de Inicio', () => {
  it('la semana actual va en azul y la anterior, que es referencia, en gris', () => {
    expect(COLORES_DE_LA_SEMANA).toEqual({ actual: '#2563eb', anterior: '#94a3b8' });
  });
});
