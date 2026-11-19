import { describe, expect, it } from 'vitest';
import {
  controlesPorCierre,
  estadoConControles,
  resultadoDeControl,
  textoDelControl,
} from './controles';

const leido = {
  cierre_id: 'c1',
  canal_id: 'py',
  tipo: 'PedidosYa',
  cantidad: 3,
  total_centavos: 10000000,
  ventas_cantidad: 3,
  ventas_centavos: 10000000,
};

describe('resultadoDeControl', () => {
  it('lo facturado contra lo cargado: $100.000 en tres ventas da correcto', () => {
    expect(resultadoDeControl(leido, 50000)).toEqual({
      canalId: 'py',
      tipo: 'PedidosYa',
      anotadoCentavos: 10000000,
      cargadoCentavos: 10000000,
      diferenciaCentavos: 0,
      cantidadAnotada: 3,
      cantidadCargada: 3,
      fuera: false,
    });
  });

  it('si falta cargar una venta, el total no da y queda fuera', () => {
    const resultado = resultadoDeControl({ ...leido, ventas_centavos: 7500000 }, 50000);
    expect(resultado).toMatchObject({ diferenciaCentavos: 2500000, fuera: true });
  });

  it('una diferencia dentro de la tolerancia no queda fuera', () => {
    expect(resultadoDeControl({ ...leido, ventas_centavos: 9990000 }, 50000).fuera).toBe(false);
  });

  it('la cantidad anotada se compara; sin anotarla, no', () => {
    expect(resultadoDeControl({ ...leido, ventas_cantidad: 2 }, 50000).fuera).toBe(true);
    expect(resultadoDeControl({ ...leido, cantidad: null, ventas_cantidad: 2 }, 50000).fuera).toBe(
      false,
    );
  });
});

describe('estadoConControles', () => {
  it('con diferencia si la caja o algún tipo no da', () => {
    const bien = resultadoDeControl(leido, 0);
    const mal = { ...bien, fuera: true };
    expect(estadoConControles('cierra', [bien])).toBe('cierra');
    expect(estadoConControles('cierra', [bien, mal])).toBe('con_diferencia');
    expect(estadoConControles('con_diferencia', [])).toBe('con_diferencia');
  });
});

describe('controlesPorCierre', () => {
  it('agrupa los controles de cada cierre', () => {
    const otro = { ...leido, cierre_id: 'c2' };
    const grupos = controlesPorCierre([leido, otro, { ...leido, canal_id: 'ch' }], 0);
    expect(grupos.get('c1')).toHaveLength(2);
    expect(grupos.get('c2')).toHaveLength(1);
  });
});

describe('textoDelControl', () => {
  const control = resultadoDeControl(leido, 50000);

  it('dice si da correcto o cuánto falta cargar o sobra', () => {
    expect(textoDelControl(control)).toBe('Da correcto');
    expect(textoDelControl({ ...control, diferenciaCentavos: 2500000, fuera: true })).toBe(
      'Faltan cargar $25.000,00',
    );
    expect(textoDelControl({ ...control, diferenciaCentavos: -100000, fuera: true })).toBe(
      'Hay $1.000,00 cargados de más',
    );
  });

  it('si solo no coincide la cantidad, lo dice', () => {
    expect(textoDelControl({ ...control, cantidadCargada: 2, fuera: true })).toBe(
      'Se anotaron 3 ventas y hay 2 cargadas',
    );
  });
});
