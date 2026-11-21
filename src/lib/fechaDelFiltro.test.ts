import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { fechaDiaMesAnio } from './fechaDelFiltro';

// Los filtros muestran día/mes/año aunque el navegador esté en inglés (Santiago, 2026-11-20).
describe('fechaDiaMesAnio', () => {
  it('pasa la fecha de la base a día/mes/año', () => {
    expect(fechaDiaMesAnio('2026-11-20')).toBe('20/11/2026');
    expect(fechaDiaMesAnio('2026-01-05')).toBe('05/01/2026');
  });

  it('sin fecha, dice dd/mm/aaaa', () => {
    expect(fechaDiaMesAnio('')).toBe('dd/mm/aaaa');
  });
});

describe('el filtro de fecha', () => {
  const fuente = readFileSync('src/components/panel/FiltroDeFecha.tsx', 'utf8');

  it('muestra el día/mes/año y abre el calendario del navegador al tocarlo', () => {
    expect(fuente).toContain('fechaDiaMesAnio(fecha)');
    expect(fuente).toContain('showPicker()');
  });

  it('sigue mandando la fecha en el campo del formulario, con su etiqueta', () => {
    expect(fuente).toContain('type="date"');
    expect(fuente).toContain('name={name}');
    expect(fuente).toContain('htmlFor={id}');
  });
});
