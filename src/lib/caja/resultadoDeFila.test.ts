import { describe, expect, it } from 'vitest';
import { resultadoDeFila, type FilaConVentas } from './resultadoDeFila';

const fila: FilaConVentas = {
  fondo_inicial_centavos: 1000000,
  efectivo_centavos: 2500000,
  credito_centavos: 0,
  debito_centavos: 0,
  qr_centavos: 1500000,
  transferencia_centavos: 0,
  retiros_centavos: 500000,
  gastos_centavos: 120000,
  ventas_efectivo_centavos: 2120000,
  ventas_credito_centavos: 0,
  ventas_debito_centavos: 0,
  ventas_qr_centavos: 1500000,
  ventas_transferencia_centavos: 0,
  tolerancia_centavos: 50000,
};

describe('resultadoDeFila', () => {
  it('compara lo declarado con lo vendido y cierra', () => {
    const resultado = resultadoDeFila(fila);
    expect(resultado.estado).toBe('cierra');
    expect(resultado.diferenciaTotalCentavos).toBe(0);
  });

  it('con un faltante de efectivo queda con diferencia', () => {
    const resultado = resultadoDeFila({ ...fila, efectivo_centavos: 2000000 });
    expect(resultado.estado).toBe('con_diferencia');
    expect(resultado.medios[0]).toMatchObject({ medio: 'efectivo', diferenciaCentavos: -500000 });
  });

  it('nunca espera: un día sin ventas se compara igual, y lo declarado en QR es sobrante', () => {
    const sinVentas = { ...fila, ventas_efectivo_centavos: 0, ventas_qr_centavos: 0 };
    const resultado = resultadoDeFila(sinVentas);
    expect(resultado.estado).toBe('con_diferencia');
    expect(resultado.medios.find((m) => m.medio === 'qr')).toMatchObject({
      esperadoCentavos: 0,
      diferenciaCentavos: 1500000,
    });
  });

  it('un día sin ventas cierra si en la caja quedó lo que tenía que quedar', () => {
    const sinVentas = {
      ...fila,
      efectivo_centavos: 380000,
      qr_centavos: 0,
      ventas_efectivo_centavos: 0,
      ventas_qr_centavos: 0,
    };
    expect(resultadoDeFila(sinVentas).estado).toBe('cierra');
  });
});
