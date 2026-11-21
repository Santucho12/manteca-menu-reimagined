import { describe, expect, it } from 'vitest';
import {
  ENLACE_ACTIVO,
  ENLACE_BASE,
  ENLACE_INACTIVO,
  FONDO_ACTIVO,
  INSIGNIA_LATERAL,
  TITULO_DE_GRUPO,
} from './estilosDeLaBarra';

// La barra lateral estilo Linear / Modern Minimal sin azul y con aire vertical (Santiago, 2026-11-20, pedido 102).
describe('la barra lateral', () => {
  it('usa radios rounded-xl sobrios sin elementos toscos', () => {
    expect(ENLACE_BASE).toContain('rounded-xl');
    expect(FONDO_ACTIVO).toContain('rounded-xl');
  });

  it('la activa es monocromática: en el color del texto y fondo gris claro con borde, sin azul', () => {
    expect(ENLACE_ACTIVO).toContain('text-foreground');
    expect(ENLACE_ACTIVO).not.toContain('text-primary');
    expect(FONDO_ACTIVO).toContain('bg-slate-100');
    expect(FONDO_ACTIVO).not.toContain('primary');
  });

  it('los inactivos usan grises limpios y hover suave', () => {
    expect(ENLACE_INACTIVO).toContain('text-slate-500');
    expect(ENLACE_INACTIVO).toContain('hover:bg-slate-100/70');
  });

  it('los títulos de grupo son discretos y con tracking refinado', () => {
    expect(TITULO_DE_GRUPO).toContain('text-[11px]');
    expect(TITULO_DE_GRUPO).toContain('uppercase');
    expect(TITULO_DE_GRUPO).toContain('tracking-[0.16em]');
  });

  it('las insignias laterales son números compactos y claros', () => {
    expect(INSIGNIA_LATERAL).toContain('text-rose-600');
    expect(INSIGNIA_LATERAL).toContain('tabular-nums');
  });
});
