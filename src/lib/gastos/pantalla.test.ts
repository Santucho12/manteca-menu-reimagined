import { describe, expect, it } from 'vitest';
import {
  avisoDeLaCarga,
  enlaceDeGastos,
  fechaParaMostrar,
  filtrosDeGastos,
  nombreDeFrecuencia,
  nombreDeMedio,
  opcionesDeFrecuencia,
  opcionesDeMedio,
  opcionesParaElegir,
} from './pantalla';

const HOY = '2026-10-08';
const CATEGORIA = '6f1c1e0a-2b1d-4c1e-9a6b-1f2e3d4c5b6a';

describe('filtrosDeGastos', () => {
  it('por defecto, el mes en curso y todos', () => {
    expect(filtrosDeGastos({}, HOY)).toEqual({
      mes: '2026-10',
      desde: '2026-10-01',
      hasta: '2026-10-31',
      tipo: null,
      categoriaId: null,
      pagina: 1,
    });
  });

  it('lee el mes, el tipo, la categoria y la pagina de la URL', () => {
    const filtros = filtrosDeGastos(
      { mes: '2026-09', tipo: 'fijos', categoria: CATEGORIA, pagina: '3' },
      HOY,
    );
    expect(filtros).toEqual({
      mes: '2026-09',
      desde: '2026-09-01',
      hasta: '2026-09-30',
      tipo: 'fijos',
      categoriaId: CATEGORIA,
      pagina: 3,
    });
  });

  it('ignora un tipo inventado o un id que no es id', () => {
    const filtros = filtrosDeGastos({ tipo: 'todos', categoria: 'hola' }, HOY);
    expect([filtros.tipo, filtros.categoriaId]).toEqual([null, null]);
  });
});

describe('enlaceDeGastos', () => {
  it('sin nada de mas en el mes en curso', () => {
    expect(enlaceDeGastos(filtrosDeGastos({}, HOY), HOY)).toBe('/admin/gastos');
  });

  it('con los filtros que cambiaron', () => {
    const filtros = {
      ...filtrosDeGastos({}, HOY),
      mes: '2026-09',
      tipo: 'caja' as const,
      categoriaId: CATEGORIA,
      pagina: 2,
    };
    expect(enlaceDeGastos(filtros, HOY)).toBe(
      `/admin/gastos?mes=2026-09&tipo=caja&categoria=${CATEGORIA}&pagina=2`,
    );
  });
});

describe('nombres', () => {
  it('del medio de pago y la frecuencia', () => {
    expect(nombreDeMedio('efectivo_caja')).toBe('Efectivo de la caja');
    expect(nombreDeFrecuencia('bimestral')).toBe('Cada dos meses');
  });
});

describe('opcionesParaElegir', () => {
  const lista = [
    { id: 'a', nombre: 'Alquiler', activo: true },
    { id: 'b', nombre: 'Viejo', activo: false },
    { id: 'c', nombre: 'Otro viejo', activo: false },
  ];

  it('ofrece lo activo y, de lo desactivado, solo lo que ya tenia', () => {
    expect(opcionesParaElegir(lista, 'b', 'Elegí una categoría')).toEqual([
      { valor: '', texto: 'Elegí una categoría' },
      { valor: 'a', texto: 'Alquiler' },
      { valor: 'b', texto: 'Viejo (desactivado)' },
    ]);
  });
});

describe('avisoDeLaCarga', () => {
  it('dice qué quedó anotado', () => {
    expect(avisoDeLaCarga('gasto')).toBe('Gasto cargado');
    expect(avisoDeLaCarga('fijo')).toBe('Gasto fijo creado');
    expect(avisoDeLaCarga('porPagar')).toBe('Quedó por pagar');
  });
});

describe('fechaParaMostrar', () => {
  it('dia, mes y año', () => {
    expect(fechaParaMostrar('2026-10-08')).toBe('08/10/2026');
  });
});

describe('opcionesDeMedio y opcionesDeFrecuencia', () => {
  it('con efectivo y cheque, pero sin el efectivo de la caja, que sale por el cierre', () => {
    expect(opcionesDeMedio().map((o) => o.texto)).toEqual([
      'Efectivo (fuera de la caja)',
      'Transferencia',
      'Tarjeta',
      'Cheque',
      'Otro',
    ]);
    expect(opcionesDeFrecuencia()[0]).toEqual({ valor: 'mensual', texto: 'Todos los meses' });
  });

  it('con el efectivo de la caja en un gasto que ya lo tenia', () => {
    expect(opcionesDeMedio('efectivo_caja').map((o) => o.valor)).toContain('efectivo_caja');
  });
});
