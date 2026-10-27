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

  it('la ayuda de Inicio cuenta todo lo que se ve en la pantalla', () => {
    const texto = AYUDAS.inicio.temas.flatMap((t) => [t.titulo, ...t.puntos]).join(' ');
    for (const parte of [
      'Ventas:',
      'Gastos:',
      'Balance:',
      'Ticket promedio:',
      'las ventas menos los gastos',
      'dividido',
      'hoy y los 6 días anteriores',
      'acumulado',
      'torta',
      'medallas',
      'Otras',
    ]) {
      expect(texto).toContain(parte);
    }
  });

  it('cada pantalla del panel tiene su ayuda', () => {
    const claves = [
      'inicio',
      'cuenta',
      'proveedores',
      'gastos',
      'categorias',
      'recurrentes',
      'ventas',
      'canales',
      'caja',
      'control',
      'menu',
      'aumento',
      'reportes',
      'usuarios',
      'auditoria',
    ];
    expect(Object.keys(AYUDAS).sort()).toEqual([...claves].sort());
  });
});
