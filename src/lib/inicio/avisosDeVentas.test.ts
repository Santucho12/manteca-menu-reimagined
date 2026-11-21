import { describe, expect, it } from 'vitest';
import { avisosDeInicio, type DatosDeAvisos } from './avisos';

const base: DatosDeAvisos = {
  conDiferencia: { cantidad: 0, desde: null },
  ayerSinCierre: null,
  pendientes: 0,
  sinClasificar: { cantidad: 0, desde: null, categoriaId: null },
};

describe('los avisos de ventas en Inicio (pedido 102)', () => {
  it('avisa los descuentos grandes de hoy y lleva a Ventas', () => {
    expect(avisosDeInicio({ ...base, descuentosGrandes: 2 })).toMatchObject([
      { texto: 'Hoy hubo 2 descuentos grandes (30 % o más).', enlace: '/admin/ventas' },
    ]);
  });

  it('avisa las ventas editadas hoy después de cobrarlas', () => {
    expect(avisosDeInicio({ ...base, editadasHoy: 1 })).toMatchObject([
      { texto: 'Hoy se editó 1 venta después de cobrar.', enlace: '/admin/ventas' },
    ]);
  });

  it('sin descuentos grandes ni ediciones no avisa nada', () => {
    expect(avisosDeInicio({ ...base, descuentosGrandes: 0, editadasHoy: 0 })).toEqual([]);
  });
});

describe('contarAvisosDeVentas', () => {
  it('un descuento es grande desde el 30 % de lo que sumaba; cuentan las editadas', async () => {
    const { contarAvisosDeVentas } = await import('./ventasParaAvisar');
    const ventas = [
      { total_centavos: 7000, descuento_centavos: 3000, editada: false },
      { total_centavos: 8000, descuento_centavos: 2000, editada: true },
      { total_centavos: 1000, descuento_centavos: 0, editada: true },
    ];
    expect(contarAvisosDeVentas(ventas)).toEqual({ descuentosGrandes: 1, editadasHoy: 2 });
  });
});

describe('cada aviso dice qué número del menú lateral suma', () => {
  it('los de ventas suman a Ventas y los gastos sin clasificar a Gastos', () => {
    const avisos = avisosDeInicio({
      ...base,
      descuentosGrandes: 3,
      sinClasificar: { cantidad: 113, desde: null, categoriaId: null },
    });
    expect(avisos.map((a) => [a.seccion, a.cantidad])).toEqual([
      ['gastos', 113],
      ['ventas', 3],
    ]);
  });
});
