import { describe, expect, it } from 'vitest';
import { muestraProveedor } from './proveedor';

const categorias = [
  { id: 'merca', nombre: 'Mercadería', activo: true, pide_proveedor: true },
  { id: 'luz', nombre: 'Servicios', activo: true, pide_proveedor: false },
];
const nuevo = { categoriaId: '', proveedorId: '' };

describe('muestraProveedor', () => {
  it('si la categoría elegida lo pide', () => {
    expect(muestraProveedor(categorias, 'merca', nuevo)).toBe(true);
    expect(muestraProveedor(categorias, 'luz', nuevo)).toBe(false);
    expect(muestraProveedor(categorias, '', nuevo)).toBe(false);
  });

  it('si el gasto ya tenía uno y no le cambiaron la categoría', () => {
    expect(muestraProveedor(categorias, 'luz', { categoriaId: 'luz', proveedorId: 'p' })).toBe(
      true,
    );
    expect(muestraProveedor(categorias, 'luz', { categoriaId: 'merca', proveedorId: 'p' })).toBe(
      false,
    );
  });
});
