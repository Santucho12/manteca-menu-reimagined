import { describe, expect, it } from 'vitest';
import { buscarInsumos } from './buscarInsumos';

const insumos = [
  { id: 'h', nombre: 'Harina 000', unidad: 'g' as const },
  { id: 'a', nombre: 'Azúcar', unidad: 'g' as const },
  { id: 'l', nombre: 'Leche entera', unidad: 'ml' as const },
];

describe('buscarInsumos', () => {
  it('sin texto ofrece todos', () => {
    expect(buscarInsumos(insumos, '', [])).toEqual(insumos);
  });

  it('busca sin importar tildes ni mayusculas, por cada palabra', () => {
    expect(buscarInsumos(insumos, 'azucar', []).map((i) => i.id)).toEqual(['a']);
    expect(buscarInsumos(insumos, 'ENTERA le', []).map((i) => i.id)).toEqual(['l']);
  });

  it('los que ya estan elegidos en la receta siguen en la lista', () => {
    expect(buscarInsumos(insumos, 'leche', ['h']).map((i) => i.id)).toEqual(['h', 'l']);
  });
});
