import { describe, expect, it } from 'vitest';
import type { ResultadoDeMedio } from './resultado';
import { titularDelCierre } from './titular';

const medio = (
  nombre: ResultadoDeMedio['medio'],
  diferencia: number,
  fuera = diferencia !== 0,
): ResultadoDeMedio => ({
  medio: nombre,
  declaradoCentavos: 0,
  esperadoCentavos: 0,
  diferenciaCentavos: diferencia,
  fuera,
});

const cierra = { estado: 'cierra', anulado: false } as const;
const conDiferencia = { estado: 'con_diferencia', anulado: false } as const;

describe('titularDelCierre', () => {
  it('un cierre sin diferencia dice que cierra', () => {
    expect(titularDelCierre(cierra, [medio('efectivo', 0)])).toBe('La caja cierra');
  });

  it('con un solo medio fuera de la tolerancia, dice cuanto falta o sobra y en cual', () => {
    expect(titularDelCierre(conDiferencia, [medio('efectivo', -100000)])).toBe(
      'Faltan $1.000,00 en efectivo',
    );
    expect(
      titularDelCierre(conDiferencia, [medio('qr', 250000), medio('efectivo', 10, false)]),
    ).toBe('Sobran $2.500,00 en QR');
    expect(titularDelCierre(conDiferencia, [medio('credito', -300000)])).toBe(
      'Faltan $3.000,00 en tarjeta de crédito',
    );
  });

  it('con varios medios fuera, no suma: dice en cuantos no cierra', () => {
    const medios = [medio('efectivo', -500000), medio('credito', 500000)];
    expect(titularDelCierre(conDiferencia, medios)).toBe('No cierra en 2 medios de pago');
  });

  it('uno anulado se dice anulado, sea cual sea su resultado', () => {
    expect(titularDelCierre({ estado: 'con_diferencia', anulado: true }, [medio('qr', -5)])).toBe(
      'Cierre anulado',
    );
  });
});
