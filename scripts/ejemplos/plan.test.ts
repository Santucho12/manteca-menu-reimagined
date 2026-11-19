import { describe, expect, it } from 'vitest';
import { planDeEjemplo } from './plan';
import type { FormaDeEjemplo } from './ventas';

const formas: FormaDeEjemplo[] = [
  {
    productoId: 'p1',
    presentacionId: 'f1',
    descripcion: 'Medialuna · Unidad',
    precioCentavos: 200000,
  },
];
const HOY = '2026-11-18';
const AYER = '2026-11-17';

describe('planDeEjemplo', () => {
  const plan = planDeEjemplo(89, HOY, formas, 30);

  it('cubre los días hasta ayer, sin hoy', () => {
    expect(plan.dias).toHaveLength(30);
    expect(plan.dias.at(-1)).toBe(AYER);
    expect(plan.dias).not.toContain(HOY);
  });

  it('dos días no abrió: no tienen ventas ni cierre', () => {
    expect(plan.sinAbrir).toHaveLength(2);
    for (const dia of plan.sinAbrir) {
      expect(plan.ventas.some((v) => v.fecha === dia)).toBe(false);
      expect(plan.cierres.some((c) => c.fecha === dia)).toBe(false);
    }
  });

  it('ayer tiene ventas y le falta el cierre; los demás días, uno cada uno', () => {
    expect(plan.ventas.some((v) => v.fecha === AYER)).toBe(true);
    expect(plan.cierres.some((c) => c.fecha === AYER)).toBe(false);
    const conCierre = plan.dias.filter((d) => d !== AYER && !plan.sinAbrir.includes(d));
    expect(plan.cierres.map((c) => c.fecha)).toEqual(conCierre);
  });

  it('las ventas a mano no pasan por la caja: los cierres cuadran solo con las del mostrador', () => {
    expect(plan.aMano.length).toBeGreaterThan(0);
    for (const venta of plan.aMano) expect(plan.sinAbrir).not.toContain(venta.fecha);
  });

  it('los gastos son del período, y con la misma semilla sale el mismo plan', () => {
    for (const gasto of plan.gastos) expect(plan.dias).toContain(gasto.fecha);
    expect(planDeEjemplo(89, HOY, formas, 30)).toEqual(plan);
  });
});
