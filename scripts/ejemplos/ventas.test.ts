import { describe, expect, it } from 'vitest';
import { diaEnArgentina } from '../../src/lib/fechas';
import { crearAzar } from './azar';
import { ventasAManoDelDia, ventasDelDia, type FormaDeEjemplo } from './ventas';

const formas: FormaDeEjemplo[] = [
  {
    productoId: 'p1',
    presentacionId: 'f1',
    descripcion: 'Medialuna · Docena',
    precioCentavos: 1800000,
  },
  {
    productoId: 'p1',
    presentacionId: 'f2',
    descripcion: 'Medialuna · Unidad',
    precioCentavos: 200000,
  },
  { productoId: 'p2', presentacionId: 'f3', descripcion: 'Café · Grande', precioCentavos: 350000 },
];

const MARTES = '2026-11-17';
const SABADO = '2026-11-14';

describe('ventasDelDia', () => {
  it('cada venta suma sus renglones, y sus pagos suman el total con uno o dos medios distintos', () => {
    for (const venta of ventasDelDia(crearAzar(1), MARTES, formas)) {
      const total = venta.renglones.reduce((s, r) => s + r.precioCentavos * r.cantidad, 0);
      expect(venta.totalCentavos).toBe(total);
      expect(venta.pagos.reduce((s, p) => s + p.montoCentavos, 0)).toBe(total);
      expect(venta.pagos.length === 1 || venta.pagos[0]!.medio !== venta.pagos[1]!.medio).toBe(
        true,
      );
      for (const pago of venta.pagos) expect(pago.montoCentavos).toBeGreaterThan(0);
    }
  });

  it('cada venta es de ese día en Argentina, en horario de atención', () => {
    for (const venta of ventasDelDia(crearAzar(2), MARTES, formas)) {
      expect(venta.fecha).toBe(MARTES);
      expect(diaEnArgentina(new Date(venta.cerradaEn))).toBe(MARTES);
    }
  });

  it('un sábado se vende más que un martes, y alguna venta se paga con dos medios', () => {
    const martes = ventasDelDia(crearAzar(3), MARTES, formas);
    const sabado = ventasDelDia(crearAzar(3), SABADO, formas);
    expect(martes.length).toBeGreaterThanOrEqual(40);
    expect(sabado.length).toBeGreaterThan(martes.length);
    expect([...martes, ...sabado].some((v) => v.pagos.length === 2)).toBe(true);
  });

  it('con la misma semilla salen las mismas ventas', () => {
    expect(ventasDelDia(crearAzar(4), MARTES, formas)).toEqual(
      ventasDelDia(crearAzar(4), MARTES, formas),
    );
  });
});

describe('ventasAManoDelDia', () => {
  it('a veces hay un encargo o una venta a comercios, cobrados por transferencia', () => {
    const azar = crearAzar(6);
    const ventas = Array.from({ length: 30 }, () => ventasAManoDelDia(azar, MARTES, formas)).flat();
    expect(ventas.length).toBeGreaterThan(5);
    for (const venta of ventas) {
      expect(['Encargo', 'Venta a comercios']).toContain(venta.tipo);
      expect(venta.pagos).toEqual([{ medio: 'transferencia', montoCentavos: venta.totalCentavos }]);
      expect(venta.fecha).toBe(MARTES);
    }
  });
});
