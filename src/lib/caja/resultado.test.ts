import { describe, expect, it } from 'vitest';
import { resultadoDelCierre, type CierreDeclarado } from './resultado';

const declarado: CierreDeclarado = {
  fondoInicialCentavos: 1000000,
  retirosCentavos: 500000,
  gastosCentavos: 120000,
  medios: { efectivo: 2500050, credito: 300000, debito: 200000, qr: 0, transferencia: 150000 },
};

const ventas = { efectivo: 2120000, credito: 300000, debito: 200000, qr: 0, transferencia: 150000 };

describe('resultadoDelCierre', () => {
  it('sin ventas espera, y no muestra esperado ni diferencia', () => {
    const resultado = resultadoDelCierre(declarado, null, 50000);
    expect(resultado.estado).toBe('esperando_ventas');
    expect(resultado.diferenciaTotalCentavos).toBeNull();
    expect(resultado.medios[0]).toEqual({
      medio: 'efectivo',
      declaradoCentavos: 2500050,
      esperadoCentavos: null,
      diferenciaCentavos: null,
    });
  });

  it('el efectivo esperado es fondo mas ventas menos retiros y gastos', () => {
    const resultado = resultadoDelCierre(declarado, ventas, 50000);
    // 1.000.000 + 2.120.000 - 500.000 - 120.000 = 2.500.000; declarado 2.500.050.
    expect(resultado.medios[0]).toMatchObject({
      esperadoCentavos: 2500000,
      diferenciaCentavos: 50,
    });
    expect(resultado.estado).toBe('cierra');
    expect(resultado.diferenciaTotalCentavos).toBe(50);
  });

  it('un medio fuera de la tolerancia deja el cierre con diferencia', () => {
    const conFaltante = { ...ventas, credito: 360000 };
    const resultado = resultadoDelCierre(declarado, conFaltante, 50000);
    expect(resultado.medios[1]).toMatchObject({ diferenciaCentavos: -60000 });
    expect(resultado.estado).toBe('con_diferencia');
  });

  it('justo en la tolerancia cierra', () => {
    const resultado = resultadoDelCierre(declarado, { ...ventas, qr: 50000 }, 50000);
    expect(resultado.estado).toBe('cierra');
  });

  it('un dia sin ventas espera el fondo menos retiros y gastos', () => {
    const cero = { efectivo: 0, credito: 0, debito: 0, qr: 0, transferencia: 0 };
    const resultado = resultadoDelCierre(declarado, cero, 0);
    expect(resultado.medios[0]?.esperadoCentavos).toBe(380000);
  });
});
