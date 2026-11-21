import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SOMBRA_DE_INICIO } from './sombraDeInicio';

// Inicio va sobre blanco y sus tarjetas se separan del fondo con sombra (Santiago, pedido 102).
const leer = (ruta: string) => readFileSync(ruta, 'utf8');

describe('Inicio sobre blanco', () => {
  it('el marco pasa a blanco cuando la pantalla lo pide', () => {
    expect(leer('src/components/panel/MarcoDelPanel.tsx')).toContain(
      'has-[[data-fondo=blanco]]:bg-white',
    );
    expect(leer('src/components/inicio/InicioAdmin.tsx')).toContain('data-fondo="blanco"');
  });

  it('Para atender va con el borde gris de las demás, sin el rojo', () => {
    const fuente = leer('src/components/inicio/Avisos.tsx');
    expect(fuente).not.toMatch(/border-rose-\d+/);
    expect(fuente).toContain('rounded-2xl border border-border bg-card');
  });

  it('la sombra se ve sobre blanco', () => {
    expect(SOMBRA_DE_INICIO).toContain('shadow-[0_10px_30px_-12px_rgba(15,23,42,0.18)]');
  });

  it.each([
    'TarjetasDelMes',
    'Avisos',
    'MasVendidos',
    'MesAMes',
    'SemanaContraSemana',
    'GastosEnTorta',
  ])('%s usa la sombra de Inicio', (nombre) => {
    const fuente = leer(`src/components/inicio/${nombre}.tsx`);
    expect(fuente).toContain('SOMBRA_DE_INICIO');
    expect(fuente).not.toContain('shadow-card');
  });
});
