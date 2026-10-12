import { describe, expect, it } from 'vitest';
import {
  datosDeGastoParaEditar,
  esquemaAnulacion,
  esquemaCategoria,
  esquemaGasto,
  esquemaRecurrente,
  gastoParaLaBase,
  recurrenteParaLaBase,
} from './esquemas';

const CATEGORIA = '6f1c1e0a-2b1d-4c1e-9a6b-1f2e3d4c5b6a';
const PROVEEDOR = '7a2d2f1b-3c2e-4d2f-8b7c-2a3b4c5d6e7f';

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

describe('otros esquemas', () => {
  it('anular pide un motivo', () => {
    expect(esquemaAnulacion.safeParse({ id: CATEGORIA, motivo: '  ' }).success).toBe(false);
    expect(esquemaAnulacion.parse({ id: CATEGORIA, motivo: ' Duplicado ' }).motivo).toBe(
      'Duplicado',
    );
  });

  it('el recurrente pide frecuencia y primer vencimiento', () => {
    const datos = esquemaRecurrente.parse({
      ...gasto,
      frecuencia: 'bimestral',
      primerVencimiento: '2026-11-10',
    });
    expect(recurrenteParaLaBase(datos)).toMatchObject({
      frecuencia: 'bimestral',
      primer_vencimiento: '2026-11-10',
      monto_centavos: 1234550,
    });
    expect(
      esquemaRecurrente.safeParse({ ...gasto, frecuencia: 'semanal', primerVencimiento: '' })
        .success,
    ).toBe(false);
  });

  it('la categoria pide nombre de hasta 60', () => {
    expect(esquemaCategoria.safeParse({ nombre: '', pideProveedor: false }).success).toBe(false);
    expect(
      esquemaCategoria.safeParse({ nombre: 'x'.repeat(61), pideProveedor: false }).success,
    ).toBe(false);
  });
});
