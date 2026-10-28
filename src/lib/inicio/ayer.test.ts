import { describe, expect, it } from 'vitest';
import type { FilaDeCierre } from '../caja/consultas';
import { resumenDeAyer, sinAvisoSiAyerNoHuboVentas, textoDelCierre } from './ayer';

const HOY = '2026-10-21';
const AYER = '2026-10-20';
const venta = (dia: string, ventas: number, monto_centavos: number) => ({
  dia,
  ventas,
  monto_centavos,
});
const cierre = (estado: FilaDeCierre['estado'], diferencia = 0, anulado = false): FilaDeCierre => ({
  id: 'c1',
  fecha: AYER,
  estado,
  anulado,
  persona: 'Ana',
  diferenciaTotalCentavos: diferencia,
  fondoInicialCentavos: 0,
  retirosCentavos: 0,
});
const ventasDeAyer = [venta(AYER, 4, 10_000), venta(HOY, 9, 99_000)];

describe('resumenDeAyer', () => {
  it('toma solo las ventas de ayer, con su ticket promedio', () =>
    expect(resumenDeAyer(ventasDeAyer, [], HOY)).toMatchObject({
      dia: AYER,
      ventas: 4,
      montoCentavos: 10_000,
      ticketCentavos: 2_500,
    }));
  it('sin cierre, el cierre queda sin cargar', () =>
    expect(resumenDeAyer(ventasDeAyer, [], HOY).cierre).toEqual({ estado: 'sin_cargar' }));
  it('un cierre que cierra cuenta como cargado', () => {
    expect(resumenDeAyer(ventasDeAyer, [cierre('cierra')], HOY).cierre).toEqual({
      estado: 'cargado',
    });
  });
  it('con diferencia, lleva el monto y el enlace al control de ese dia', () =>
    expect(resumenDeAyer(ventasDeAyer, [cierre('con_diferencia', -1_500)], HOY).cierre).toEqual({
      estado: 'con_diferencia',
      diferenciaCentavos: -1_500,
      enlace: `/admin/caja/control?desde=${AYER}&hasta=${AYER}`,
    }));
  it('un cierre anulado no cuenta', () =>
    expect(resumenDeAyer(ventasDeAyer, [cierre('cierra', 0, true)], HOY).cierre).toEqual({
      estado: 'sin_cargar',
    }));
  it('sin ventas ayer, queda en cero y sin ticket promedio', () =>
    expect(resumenDeAyer([venta(HOY, 3, 500)], [], HOY)).toMatchObject({
      ventas: 0,
      montoCentavos: 0,
      ticketCentavos: null,
    }));
});

describe('textoDelCierre', () => {
  it('dice si se cargo, si falta o cuanto dio la diferencia', () => {
    expect(textoDelCierre({ estado: 'cargado' })).toBe('Cierre cargado');
    expect(textoDelCierre({ estado: 'sin_cargar' })).toBe('Cierre sin cargar');
    const conDiferencia = {
      estado: 'con_diferencia',
      diferenciaCentavos: -150_050,
      enlace: '',
    } as const;
    expect(textoDelCierre(conDiferencia)).toBe('Cierre con diferencia de -$1.500,50');
  });
});

describe('sinAvisoSiAyerNoHuboVentas', () => {
  const datos = {
    conDiferencia: { cantidad: 0, desde: null },
    ayerSinCierre: AYER,
    pendientes: 0,
    sinClasificar: { cantidad: 0, desde: null, categoriaId: null },
  };
  it('si ayer no hubo ventas, no avisa que falta el cierre', () =>
    expect(sinAvisoSiAyerNoHuboVentas(datos, 0).ayerSinCierre).toBeNull());
  it('si hubo ventas, el aviso sigue', () =>
    expect(sinAvisoSiAyerNoHuboVentas(datos, 2).ayerSinCierre).toBe(AYER));
});
