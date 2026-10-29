import { describe, expect, it } from 'vitest';
import { buscarOpciones } from './buscarOpcion';

const OPCIONES = [
  { valor: 'a', texto: 'Medialuna · Docena', precioCentavos: 2000000 },
  { valor: 'b', texto: 'Medialuna · Unidad', precioCentavos: 300000 },
  { valor: 'c', texto: 'Moñito · Docena', precioCentavos: 2000000 },
  { valor: 'd', texto: 'Café · Grande', precioCentavos: 450000 },
];

describe('buscarOpciones', () => {
  it('sin texto devuelve todas', () => {
    expect(buscarOpciones(OPCIONES, '  ')).toHaveLength(4);
  });

  it('no distingue mayúsculas ni tildes', () => {
    expect(buscarOpciones(OPCIONES, 'CAFE').map((o) => o.valor)).toEqual(['d']);
    expect(buscarOpciones(OPCIONES, 'monito').map((o) => o.valor)).toEqual(['c']);
  });

  it('pide todas las palabras, en cualquier orden', () => {
    expect(buscarOpciones(OPCIONES, 'docena media').map((o) => o.valor)).toEqual(['a']);
    expect(buscarOpciones(OPCIONES, 'unidad medialuna').map((o) => o.valor)).toEqual(['b']);
  });

  it('si nada coincide, no devuelve nada', () => {
    expect(buscarOpciones(OPCIONES, 'pizza')).toEqual([]);
  });
});
