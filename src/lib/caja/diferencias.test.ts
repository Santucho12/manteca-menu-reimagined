import { describe, expect, it } from 'vitest';
import { diferenciasPorMedio, textoDeDiferenciaDeMedio } from './diferencias';
import type { ResultadoDeMedio } from './resultado';

const medio = (nombre: ResultadoDeMedio['medio'], diferencia: number): ResultadoDeMedio => ({
  medio: nombre,
  declaradoCentavos: 0,
  esperadoCentavos: 0,
  diferenciaCentavos: diferencia,
  fuera: false,
});

describe('diferenciasPorMedio', () => {
  it('un faltante en un medio y un sobrante igual en otro no se compensan', () => {
    const medios = [medio('efectivo', -500000), medio('credito', 500000), medio('qr', 0)];
    expect(diferenciasPorMedio(medios)).toEqual([
      { medio: 'efectivo', centavos: -500000 },
      { medio: 'credito', centavos: 500000 },
    ]);
  });

  it('si todos dan exacto, no hay ninguna', () => {
    expect(diferenciasPorMedio([medio('efectivo', 0), medio('qr', 0)])).toEqual([]);
  });
});

describe('textoDeDiferenciaDeMedio', () => {
  it('dice que medio y si faltan o sobran', () => {
    expect(textoDeDiferenciaDeMedio({ medio: 'efectivo', centavos: -500000 })).toBe(
      'Efectivo: faltan $5.000,00',
    );
    expect(textoDeDiferenciaDeMedio({ medio: 'credito', centavos: 500000 })).toBe(
      'Tarjeta de crédito: sobran $5.000,00',
    );
  });
});
