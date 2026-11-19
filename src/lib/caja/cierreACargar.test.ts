import { describe, expect, it } from 'vitest';
import { cierreACargar } from './cierreACargar';
import type { EstadoDelTurno } from './turnos';

const HOY = '2026-11-19';
const estado: EstadoDelTurno = {
  fecha: HOY,
  turno: 1,
  trabado: false,
  motivo: null,
  fechaTrabada: null,
  turnoTrabado: null,
  postergadoHasta: null,
  proximaHora: null,
  horaDeCorte: '16:00',
};

describe('cierreACargar', () => {
  it('sin nada en la dirección, el turno abierto de hoy', () => {
    expect(cierreACargar({}, HOY, { ...estado, turno: 2 })).toEqual({ fecha: HOY, turno: 2 });
  });

  it('con la caja de ayer sin cerrar, ese cierre', () => {
    const deAyer = {
      ...estado,
      motivo: 'ayer' as const,
      fechaTrabada: '2026-11-18',
      turnoTrabado: 2 as const,
    };
    expect(cierreACargar({}, HOY, deAyer)).toEqual({ fecha: '2026-11-18', turno: 2 });
  });

  it('lo que pide la dirección, si es válido', () => {
    expect(cierreACargar({ fecha: '2026-11-10', turno: '1' }, HOY, estado)).toEqual({
      fecha: '2026-11-10',
      turno: 1,
    });
  });

  it('un día futuro, una fecha inválida o un turno raro no valen', () => {
    expect(cierreACargar({ fecha: '2026-11-30', turno: '7' }, HOY, estado)).toEqual({
      fecha: HOY,
      turno: 1,
    });
    expect(cierreACargar({ fecha: 'ayer' }, HOY, estado)).toEqual({ fecha: HOY, turno: 1 });
  });

  it('un día anterior sin turno pedido es el de la noche', () => {
    expect(cierreACargar({ fecha: '2026-11-10' }, HOY, estado)).toEqual({
      fecha: '2026-11-10',
      turno: 2,
    });
  });
});
