import { describe, expect, it } from 'vitest';
import { esquemaProveedor, proveedorParaLaBase, type DatosDeProveedor } from './esquemas';

const PROVEEDOR: DatosDeProveedor = {
  nombre: ' Molino del Sur ',
  telefono: '11 2345-6789',
  ubicacion: '',
  queCompra: 'Harina 000',
  observaciones: 'Alias: molino.sur',
};

describe('esquemaProveedor', () => {
  it('acepta un proveedor con telefono escrito como sea', () => {
    expect(esquemaProveedor.safeParse(PROVEEDOR).success).toBe(true);
  });

  it('pide el nombre', () => {
    const sinNombre = esquemaProveedor.safeParse({ ...PROVEEDOR, nombre: ' ' });
    expect(sinNombre.error?.issues[0]?.message).toBe('Escribí el nombre.');
  });

  it('explica un telefono que no sirve', () => {
    const mal = esquemaProveedor.safeParse({ ...PROVEEDOR, telefono: '15 2345 6789' });
    expect(mal.error?.issues[0]?.message).toBe(
      'Escribí el número con la característica y sin el 15, por ejemplo 11 2345 6789.',
    );
  });
});

describe('proveedorParaLaBase', () => {
  it('recorta, pasa vacios a null y guarda el telefono normalizado', () => {
    expect(proveedorParaLaBase(PROVEEDOR)).toEqual({
      nombre: 'Molino del Sur',
      telefono: '5491123456789',
      ubicacion: null,
      que_compra: 'Harina 000',
      observaciones: 'Alias: molino.sur',
    });
  });
});
