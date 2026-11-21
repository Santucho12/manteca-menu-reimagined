import { describe, expect, it } from 'vitest';
import { AYUDAS } from './ayudas';

describe('la ayuda de Inicio', () => {
  it('aclara que el balance no es la ganancia (Santiago, 2026-11-20, pedido 102)', () => {
    const texto = AYUDAS.inicio.temas.flatMap((t) => t.puntos).join(' ');
    for (const parte of ['No es la ganancia', 'costo de lo vendido', 'por pagar'])
      expect(texto).toContain(parte);
  });
});

describe('la ayuda de Inicio sigue a la pantalla', () => {
  const texto = AYUDAS.inicio.temas.flatMap((t) => t.puntos).join(' ');

  it('ya no habla del cambio contra el mes anterior: las tarjetas no lo muestran', () => {
    expect(texto).not.toContain('número chico');
    expect(texto).toContain('una línea que dice de dónde sale');
  });

  it('nombra el aviso de los productos debajo del margen mínimo', () => {
    expect(texto).toContain('productos debajo del margen mínimo');
  });

  it('dice que las etiquetas de la semana se explican al pasar el mouse', () => {
    expect(texto).toContain('Pasando el mouse');
  });
});
