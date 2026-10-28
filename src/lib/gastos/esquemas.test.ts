import { describe, expect, it } from 'vitest';
import {
  datosDeFijoParaEditar,
  datosDeGastoParaEditar,
  esquemaAnulacion,
  esquemaCarga,
  esquemaCategoria,
  esquemaClasificacion,
  esquemaDeGasto,
  esquemaFijo,
  esquemaGasto,
  fijoParaLaBase,
  gastoParaLaBase,
  recurrenteParaLaBase,
} from './esquemas';

const CATEGORIA = '6f1c1e0a-2b1d-4c1e-9a6b-1f2e3d4c5b6a';
const PROVEEDOR = '7a2d2f1b-3c2e-4d2f-8b7c-2a3b4c5d6e7f';
const CLAVE = '9b1c2d3e-4f5a-4b6c-8d7e-0f1a2b3c4d5e';
const HOY = '2026-10-08';

const gasto = {
  fecha: '2026-10-08',
  categoriaId: CATEGORIA,
  monto: '12.345,50',
  descripcion: '  Luz  ',
  proveedorId: '',
  medioDePago: 'transferencia' as const,
  comprobante: '',
};

describe('esquemaGasto', () => {
  it('acepta un gasto valido y lo pasa a la base en centavos', () => {
    const datos = esquemaGasto.parse(gasto);
    expect(gastoParaLaBase(datos)).toEqual({
      fecha: '2026-10-08',
      categoria_id: CATEGORIA,
      monto_centavos: 1234550,
      descripcion: 'Luz',
      proveedor_id: null,
      medio_de_pago: 'transferencia',
      comprobante: null,
    });
  });

  it('acepta la clave de carga y no la pasa con las columnas del gasto', () => {
    const clave = '9b1c2d3e-4f5a-4b6c-8d7e-0f1a2b3c4d5e';
    const datos = esquemaGasto.parse({ ...gasto, clave });
    expect(datos.clave).toBe(clave);
    expect(gastoParaLaBase(datos)).not.toHaveProperty('clave');
    expect(esquemaGasto.safeParse({ ...gasto, clave: 'x' }).success).toBe(false);
  });

  it('explica un monto mal escrito', () => {
    const resultado = esquemaGasto.safeParse({ ...gasto, monto: '12,345' });
    expect(resultado.error?.issues[0]?.message).toBe(
      'Escribí el monto en pesos, con coma para los centavos: 12.345,50.',
    );
  });

  it('rechaza una fecha imposible, sin categoria o un medio de pago inventado', () => {
    expect(esquemaGasto.safeParse({ ...gasto, fecha: '2026-02-30' }).success).toBe(false);
    expect(esquemaGasto.safeParse({ ...gasto, categoriaId: '' }).success).toBe(false);
    expect(esquemaGasto.safeParse({ ...gasto, medioDePago: 'cheque' }).success).toBe(false);
  });

  it('el proveedor es opcional pero, si viene, es un id', () => {
    expect(esquemaGasto.safeParse({ ...gasto, proveedorId: PROVEEDOR }).success).toBe(true);
    expect(esquemaGasto.safeParse({ ...gasto, proveedorId: 'x' }).success).toBe(false);
  });

  it('vuelve al formulario como se escribe', () => {
    const fila = {
      fecha: '2026-10-08',
      categoria_id: CATEGORIA,
      monto_centavos: 8000,
      descripcion: null,
      proveedor_id: PROVEEDOR,
      medio_de_pago: 'tarjeta' as const,
      comprobante: 'A-1',
    };
    expect(datosDeGastoParaEditar(fila)).toEqual({
      fecha: '2026-10-08',
      categoriaId: CATEGORIA,
      monto: '80',
      descripcion: '',
      proveedorId: PROVEEDOR,
      medioDePago: 'tarjeta',
      comprobante: 'A-1',
    });
  });
});

describe('cargar un gasto, suelto o fijo', () => {
  it('sin repeticion, la fecha no puede ser futura', () => {
    const futuro = esquemaCarga(HOY).safeParse({ ...gasto, fecha: '2026-10-09', seRepite: 'no' });
    expect(futuro.error?.issues[0]?.message).toBe(
      'Un gasto que todavía no pagaste no se carga. Si se repite, elegí cada cuánto.',
    );
    expect(esquemaCarga(HOY).safeParse({ ...gasto, seRepite: 'no' }).success).toBe(true);
  });

  it('con repeticion la fecha puede ser futura, y la repeticion es una de las cuatro', () => {
    const fijo = { ...gasto, fecha: '2026-11-09', seRepite: 'mensual' };
    expect(esquemaCarga(HOY).safeParse(fijo).success).toBe(true);
    expect(esquemaCarga(HOY).safeParse({ ...fijo, seRepite: 'semanal' }).success).toBe(false);
  });

  it('un fijo se guarda con su primer pago y su clave', () => {
    const datos = esquemaCarga(HOY).parse({ ...gasto, seRepite: 'bimestral', clave: CLAVE });
    expect(recurrenteParaLaBase(datos)).toEqual({
      categoria_id: CATEGORIA,
      monto_centavos: 1234550,
      descripcion: 'Luz',
      proveedor_id: null,
      medio_de_pago: 'transferencia',
      frecuencia: 'bimestral',
      primer_vencimiento: '2026-10-08',
      clave: CLAVE,
    });
  });

  it('editar un gasto no deja una fecha futura', () => {
    expect(esquemaDeGasto(HOY).safeParse({ ...gasto, fecha: '2026-10-09' }).success).toBe(false);
    expect(esquemaDeGasto(HOY).safeParse(gasto).success).toBe(true);
  });
});

describe('editar un fijo', () => {
  const fijo = {
    categoriaId: CATEGORIA,
    monto: '500',
    descripcion: '',
    proveedorId: '',
    medioDePago: 'transferencia',
    frecuencia: 'mensual',
    proximoPago: '2026-10-09',
  };

  it('el proximo pago tiene que ser despues de hoy', () => {
    expect(esquemaFijo(HOY).safeParse(fijo).success).toBe(true);
    const hoy = esquemaFijo(HOY).safeParse({ ...fijo, proximoPago: HOY });
    expect(hoy.error?.issues[0]?.message).toBe('El próximo pago tiene que ser después de hoy.');
  });

  it('vuelve al formulario con el proximo pago y se guarda la serie solo si cambia', () => {
    const fila = {
      categoria_id: CATEGORIA,
      monto_centavos: 50000,
      descripcion: 'Alquiler',
      proveedor_id: null,
      medio_de_pago: 'transferencia' as const,
      frecuencia: 'mensual' as const,
      primer_vencimiento: '2026-01-31',
      generar_desde: null,
    };
    const datos = datosDeFijoParaEditar(fila, HOY);
    expect(datos).toMatchObject({ monto: '500', frecuencia: 'mensual', proximoPago: '2026-10-31' });
    expect(fijoParaLaBase(datos, false)).not.toHaveProperty('primer_vencimiento');
    expect(fijoParaLaBase(datos, true)).toMatchObject({
      frecuencia: 'mensual',
      primer_vencimiento: '2026-10-31',
    });
  });
});

describe('otros esquemas', () => {
  it('anular pide un motivo', () => {
    expect(esquemaAnulacion.safeParse({ id: CATEGORIA, motivo: '  ' }).success).toBe(false);
    expect(esquemaAnulacion.parse({ id: CATEGORIA, motivo: ' Duplicado ' }).motivo).toBe(
      'Duplicado',
    );
  });

  it('clasificar pide la categoria y deja el proveedor vacio', () => {
    const datos = { id: CATEGORIA, categoriaId: '', proveedorId: '' };
    expect(esquemaClasificacion.safeParse(datos).success).toBe(false);
    expect(esquemaClasificacion.parse({ ...datos, categoriaId: CATEGORIA })).toEqual({
      ...datos,
      categoriaId: CATEGORIA,
    });
  });

  it('la categoria pide nombre de hasta 60', () => {
    expect(esquemaCategoria.safeParse({ nombre: '', pideProveedor: false }).success).toBe(false);
    expect(
      esquemaCategoria.safeParse({ nombre: 'x'.repeat(61), pideProveedor: false }).success,
    ).toBe(false);
  });
});
