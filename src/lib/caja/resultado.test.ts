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
  it('un dia sin ventas con plata declarada queda con diferencia', () => {
    const cero = { efectivo: 0, credito: 0, debito: 0, qr: 0, transferencia: 0 };
    const solo = { ...declarado, fondoInicialCentavos: 0, retirosCentavos: 0, gastosCentavos: 0 };
    const resultado = resultadoDelCierre(
      { ...solo, medios: { ...solo.medios, efectivo: 0, qr: 100000 } },
      cero,
      50000,
    );
    expect(resultado.estado).toBe('con_diferencia');
  });

  it('diferencias de signo contrario dentro de la tolerancia cierran y la total es la neta', () => {
    const resultado = resultadoDelCierre(
      {
        ...declarado,
        fondoInicialCentavos: 0,
        retirosCentavos: 0,
        gastosCentavos: 0,
        medios: { efectivo: 40000, credito: 0, debito: 0, qr: 0, transferencia: 0 },
      },
      { efectivo: 0, credito: 0, debito: 0, qr: 40000, transferencia: 0 },
      50000,
    );
    expect(resultado.estado).toBe('cierra');
    expect(resultado.diferenciaTotalCentavos).toBe(0);
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

  it('cada medio dice si esta fuera de la tolerancia, y justo en ella no lo esta', () => {
    const resultado = resultadoDelCierre(
      declarado,
      { ...ventas, credito: 360000, qr: 50000 },
      50000,
    );
    expect(resultado.medios.map((m) => m.fuera)).toEqual([false, true, false, false, false]);
  });

  it('un dia sin ventas espera el fondo menos retiros y gastos', () => {
    const cero = { efectivo: 0, credito: 0, debito: 0, qr: 0, transferencia: 0 };
    const resultado = resultadoDelCierre(declarado, cero, 0);
    expect(resultado.medios[0]?.esperadoCentavos).toBe(380000);
  });
});
