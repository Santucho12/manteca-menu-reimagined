import { describe, expect, it } from 'vitest';
import {
  enlaceDeGastos,
  fechaParaMostrar,
  filtrosDeGastos,
  nombreDeFrecuencia,
  nombreDeMedio,
  opcionesDeFrecuencia,
  opcionesDeMedio,
  opcionesParaElegir,
  textoDeSinClasificar,
} from './pantalla';

const HOY = '2026-10-08';
const CATEGORIA = '6f1c1e0a-2b1d-4c1e-9a6b-1f2e3d4c5b6a';

describe('filtrosDeGastos', () => {
  it('por defecto, el mes en curso', () => {
    expect(filtrosDeGastos({}, HOY)).toEqual({
      desde: '2026-10-01',
      hasta: '2026-10-31',
      categoriaId: null,
      proveedorId: null,
      pagina: 1,
    });
  });

  it('lee las fechas, la categoria y la pagina de la URL', () => {
    const filtros = filtrosDeGastos(
      { desde: '2026-09-01', hasta: '2026-09-15', categoria: CATEGORIA, pagina: '3' },
      HOY,
    );
    expect(filtros).toMatchObject({
      desde: '2026-09-01',
      hasta: '2026-09-15',
      categoriaId: CATEGORIA,
      pagina: 3,
    });
  });

  it('ignora una fecha invalida o un id que no es id', () => {
    const filtros = filtrosDeGastos({ desde: '2026-13-01', proveedor: 'hola' }, HOY);
    expect(filtros.desde).toBe('2026-10-01');
    expect(filtros.proveedorId).toBeNull();
  });

  it('si las fechas vienen al reves, las da vuelta', () => {
    const filtros = filtrosDeGastos({ desde: '2026-09-30', hasta: '2026-09-01' }, HOY);
    expect([filtros.desde, filtros.hasta]).toEqual(['2026-09-01', '2026-09-30']);
  });
});

describe('enlaceDeGastos', () => {
  it('sin nada de mas en el mes en curso', () => {
    expect(enlaceDeGastos(filtrosDeGastos({}, HOY), HOY)).toBe('/admin/gastos');
  });

  it('con los filtros que cambiaron', () => {
    const filtros = { ...filtrosDeGastos({}, HOY), categoriaId: CATEGORIA, pagina: 2 };
    expect(enlaceDeGastos(filtros, HOY)).toBe(`/admin/gastos?categoria=${CATEGORIA}&pagina=2`);
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

describe('fechaParaMostrar', () => {
  it('dia, mes y año', () => {
    expect(fechaParaMostrar('2026-10-08')).toBe('08/10/2026');
  });
});

describe('opcionesDeMedio y opcionesDeFrecuencia', () => {
  it('todas, con su nombre', () => {
    expect(opcionesDeMedio().map((o) => o.texto)).toEqual([
      'Efectivo de la caja',
      'Transferencia',
      'Tarjeta',
      'Otro',
    ]);
    expect(opcionesDeFrecuencia()[0]).toEqual({ valor: 'mensual', texto: 'Todos los meses' });
  });
});

describe('textoDeSinClasificar', () => {
  it('en singular y en plural', () => {
    expect(textoDeSinClasificar(1)).toBe('Hay 1 gasto de caja sin clasificar');
    expect(textoDeSinClasificar(3)).toBe('Hay 3 gastos de caja sin clasificar');
  });
});
