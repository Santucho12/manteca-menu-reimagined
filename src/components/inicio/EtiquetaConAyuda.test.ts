import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// La frase y la etiqueta de la semana muestran su explicación al pasar el mouse (pedido 102).
describe('las etiquetas de la semana con explicación', () => {
  it('la explicación aparece al pasar el mouse o al enfocarla con el teclado', () => {
    const fuente = readFileSync('src/components/inicio/EtiquetaConAyuda.tsx', 'utf8');
    expect(fuente).toContain('role="tooltip"');
    expect(fuente).toContain('group-hover:opacity-100 group-focus-visible:opacity-100');
    expect(fuente).toContain('aria-describedby');
  });

  it('la semana usa las dos explicaciones', () => {
    const fuente = readFileSync('src/components/inicio/SemanaContraSemana.tsx', 'utf8');
    expect(fuente).toContain('ayuda={AYUDAS_DE_LA_SEMANA.titulo}');
    expect(fuente).toContain('ayuda={AYUDAS_DE_LA_SEMANA.chip}');
  });
});
