import { describe, expect, it } from 'vitest';
import { diferenciaConocida, resultadoDeFila, type FilaConVentas } from './resultadoDeFila';

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
  ventas_cargadas: true,
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

  it('sin las ventas del dia cargadas espera, aunque lo declarado no coincida', () => {
    const resultado = resultadoDeFila({ ...fila, efectivo_centavos: 1, ventas_cargadas: false });
    expect(resultado.estado).toBe('esperando_ventas');
    expect(resultado.diferenciaTotalCentavos).toBe(0);
    expect(resultado.medios[0]).toMatchObject({
      medio: 'efectivo',
      declaradoCentavos: 1,
      esperadoCentavos: 0,
      diferenciaCentavos: 0,
    });
  });

  it('con las ventas cargadas y ninguna venta ese dia, lo esperado es lo de la caja', () => {
    const sinVentas = {
      ...fila,
      ventas_efectivo_centavos: 0,
      ventas_qr_centavos: 0,
    };
    expect(resultadoDeFila(sinVentas).estado).toBe('con_diferencia');
  });
});

describe('diferenciaConocida', () => {
  it('es la diferencia total si el dia tiene ventas cargadas', () => {
    expect(diferenciaConocida({ ...fila, efectivo_centavos: 2000000 })).toBe(-500000);
  });

  it('es null si el cierre espera las ventas', () => {
    expect(diferenciaConocida({ ...fila, ventas_cargadas: false })).toBeNull();
  });
});
