import { describe, expect, it } from 'vitest';
import {
  contenidoDeTexto,
  datosDeFormaParaEditar,
  esquemaFormaDeCompra,
  esquemaInsumo,
  formaParaLaBase,
  insumoParaLaBase,
} from './esquemas';

const PROVEEDOR = '0b8f3c2e-5d1a-4c7e-9f2b-1a2b3c4d5e6f';
const forma = {
  proveedorId: PROVEEDOR,
  comoSeCompra: 'Bolsa de 25 kg',
  contenido: '25.000',
  precio: '32.000',
};

describe('esquemaInsumo', () => {
  it('pide el nombre y una unidad de uso valida', () => {
    expect(esquemaInsumo.safeParse({ nombre: ' ', unidad: 'g', observaciones: '' }).success).toBe(
      false,
    );
    expect(
      esquemaInsumo.safeParse({ nombre: 'Harina', unidad: 'kg', observaciones: '' }).success,
    ).toBe(false);
  });

  it('pasa a la base sin espacios y con las observaciones vacias como nulo', () => {
    const datos = esquemaInsumo.parse({ nombre: ' Harina 000 ', unidad: 'g', observaciones: ' ' });
    expect(insumoParaLaBase(datos)).toEqual({
      nombre: 'Harina 000',
      unidad_de_uso: 'g',
      observaciones: null,
    });
  });
});

describe('contenidoDeTexto', () => {
  it.each([
    ['25000', 25000],
    ['25.000', 25000],
    ['1,5', 1.5],
    ['0,125', 0.125],
    ['30', 30],
  ])('entiende %s', (texto, esperado) => {
    expect(contenidoDeTexto(texto)).toBe(esperado);
  });

  it.each(['0', '', 'mucho', '1.5', '1,2345', '25.00', '-3'])('rechaza %s', (texto) => {
    expect(contenidoDeTexto(texto)).toBeUndefined();
  });
});

describe('esquemaFormaDeCompra', () => {
  it('acepta una forma completa y la pasa a la base en centavos', () => {
    const datos = esquemaFormaDeCompra.parse(forma);
    expect(formaParaLaBase(datos)).toEqual({
      proveedor_id: PROVEEDOR,
      como_se_compra: 'Bolsa de 25 kg',
      contenido: 25000,
      precio_referencia_centavos: 3_200_000,
    });
  });

  it('el proveedor y el precio son opcionales', () => {
    const datos = esquemaFormaDeCompra.parse({ ...forma, proveedorId: '', precio: '' });
    expect(formaParaLaBase(datos)).toMatchObject({
      proveedor_id: null,
      precio_referencia_centavos: null,
    });
  });

  it('rechaza un contenido que no se entiende y un precio mal escrito', () => {
    const resultado = esquemaFormaDeCompra.safeParse({ ...forma, contenido: '0', precio: '3.2' });
    expect(resultado.success).toBe(false);
    const campos = resultado.error!.issues.map((error) => error.path[0]);
    expect(campos).toEqual(expect.arrayContaining(['contenido', 'precio']));
  });

  it('pide como se compra', () => {
    expect(esquemaFormaDeCompra.safeParse({ ...forma, comoSeCompra: ' ' }).success).toBe(false);
  });

  it('la edicion muestra el contenido y el precio como se escriben', () => {
    expect(
      datosDeFormaParaEditar({
        proveedor_id: null,
        como_se_compra: 'Maple',
        contenido: 30,
        precio_referencia_centavos: 500_050,
      }),
    ).toEqual({ proveedorId: '', comoSeCompra: 'Maple', contenido: '30', precio: '5.000,50' });
  });

  it('un contenido con decimales vuelve con coma', () => {
    const editar = datosDeFormaParaEditar({
      proveedor_id: PROVEEDOR,
      como_se_compra: 'Bidón',
      contenido: 1500.5,
      precio_referencia_centavos: null,
    });
    expect(editar).toMatchObject({ contenido: '1.500,5', precio: '' });
  });
});
