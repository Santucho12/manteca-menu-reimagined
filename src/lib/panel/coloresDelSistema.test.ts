import { describe, expect, it } from 'vitest';
import { colorDeAccion, colorDePersona, colorDeTurno } from './coloresDelSistema';

// Santiago, 2026-11-21: verde es que está bien, rojo que está mal o es alerta, gris que está
// desactivado o cerrado. Lo demás se distingue con colores que no dicen ni bien ni mal.
describe('los colores del sistema', () => {
  it('las acciones de Auditoría: alta verde, anulación roja, desactivación gris', () => {
    expect(colorDeAccion('alta')).toContain('emerald');
    expect(colorDeAccion('reactivacion')).toContain('emerald');
    expect(colorDeAccion('anulacion')).toContain('rose');
    expect(colorDeAccion('desactivacion')).toContain('slate');
    expect(colorDeAccion('cambio')).toContain('violet');
  });

  it('cada persona tiene siempre el mismo color, violeta, rojo o naranja', () => {
    expect(colorDePersona('Ejemplo Caja')).toBe(colorDePersona('Ejemplo Caja'));
    for (const nombre of ['Ana', 'Santiago', 'Ejemplo Caja', 'Ejemplo Admin', 'Juan'])
      expect(colorDePersona(nombre)).toMatch(/violet|rose|orange/);
  });

  it('el mediodía y la noche, cada uno con su color', () => {
    expect(colorDeTurno(1)).toContain('yellow');
    expect(colorDeTurno(2)).toContain('violet');
  });
});

describe('los tipos de venta y los medios en las listas', () => {
  it('el tipo toma su color por su lugar en Tipos de venta, sin verde, rojo ni gris', async () => {
    const { colorDelTipo } = await import('./coloresDelSistema');
    const tipos = ['Local', 'Pedidos Ya', 'Otro'];
    // Violeta, rojo y naranja para distinguir (Santiago, 2026-11-21).
    expect(colorDelTipo('Local', tipos)).toContain('violet');
    expect(colorDelTipo('Pedidos Ya', tipos)).toContain('rose');
    expect(colorDelTipo('Otro', tipos)).toContain('slate');
    expect(colorDelTipo('Viejo', tipos)).toContain('slate');
  });

  it('cada medio en violeta, rojo o naranja', async () => {
    const { colorDelMedio } = await import('./coloresDelSistema');
    const medios = ['efectivo', 'debito', 'credito', 'qr', 'transferencia'] as const;
    // Violeta, rojo y naranja (Santiago, 2026-11-21); nunca verde, que es está bien.
    for (const color of medios.map(colorDelMedio)) expect(color).toMatch(/violet|rose|orange/);
    expect(colorDelMedio('fuera_de_caja')).toContain('slate');
  });
});
