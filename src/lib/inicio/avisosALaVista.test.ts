import { describe, expect, it } from 'vitest';
import { avisosALaVista } from './avisosALaVista';

const aviso = (n: number) => ({ texto: `a${n}`, enlace: '/' });

describe('avisosALaVista', () => {
  it('muestra los 4 primeros y cuenta los que quedan para "Ver todos"', () => {
    const r = avisosALaVista([1, 2, 3, 4, 5].map(aviso));
    expect(r.visibles.map((a) => a.texto)).toEqual(['a1', 'a2', 'a3', 'a4']);
    expect(r.ocultos).toBe(1);
  });
  it('con 4 o menos no hay "Ver todos"', () => {
    expect(avisosALaVista([1, 2].map(aviso)).ocultos).toBe(0);
  });
});

describe('sinDescartados', () => {
  it('saca los descartados hoy; los de otro día vuelven', async () => {
    const { sinDescartados } = await import('./avisosALaVista');
    const avisos = [1, 2, 3].map(aviso);
    expect(sinDescartados(avisos, { dia: '2026-11-20', textos: ['a2'] }, '2026-11-20')).toEqual([
      aviso(1),
      aviso(3),
    ]);
    expect(sinDescartados(avisos, { dia: '2026-11-19', textos: ['a2'] }, '2026-11-20')).toEqual(
      avisos,
    );
  });
});

describe('el número del menú lateral con avisos eliminados', () => {
  it('resta lo eliminado hoy de su sección, sin bajar de cero', async () => {
    const { insigniaSinDescartados } = await import('./avisosALaVista');
    const descartados = { dia: '2026-11-20', textos: ['x'], restas: { ventas: 3 } };
    expect(insigniaSinDescartados(4, 'ventas', descartados, '2026-11-20')).toBe(1);
    expect(insigniaSinDescartados(3, 'ventas', descartados, '2026-11-20')).toBeNull();
    expect(insigniaSinDescartados(4, 'ventas', descartados, '2026-11-21')).toBe(4);
    expect(insigniaSinDescartados(5, 'caja', descartados, '2026-11-20')).toBe(5);
  });
});
