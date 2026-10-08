import { describe, expect, it } from 'vitest';
import { PREGUNTA_DE_DESACTIVAR, ayudaDelPrecio, textoDePrecios } from './pantalla';

describe('textoDePrecios', () => {
  it('dice el precio de cada presentacion y de donde sale', () => {
    expect(
      textoDePrecios(
        [
          {
            presentacionId: 'a',
            presentacion: 'Docena',
            montoCentavos: 2000000,
            origen: 'compartido',
          },
          { presentacionId: 'b', presentacion: 'Unidad', montoCentavos: 350000, origen: 'propio' },
          { presentacionId: 'c', presentacion: 'Media', montoCentavos: null, origen: null },
        ],
        'Facturas',
      ),
    ).toBe('Docena $20.000 (de Facturas) · Unidad $3.500 (propio) · Media sin precio');
  });

  it('sin ningun precio lo dice', () => {
    expect(
      textoDePrecios(
        [{ presentacionId: 'a', presentacion: 'Unidad', montoCentavos: null, origen: null }],
        'X',
      ),
    ).toBe('Unidad sin precio');
  });
});

describe('PREGUNTA_DE_DESACTIVAR', () => {
  it('explica que se puede reactivar', () => {
    expect(PREGUNTA_DE_DESACTIVAR('Flor')).toBe(
      '¿Desactivar Flor? Deja de usarse; lo podés reactivar desde Ver desactivados.',
    );
  });
});

describe('ayudaDelPrecio', () => {
  it('dice que precio usa un campo vacio', () => {
    expect(ayudaDelPrecio(300000, 'Facturas')).toBe('Vacío usa el de Facturas: $3.000.');
    expect(ayudaDelPrecio(null, 'Panes')).toBe('Vacío queda sin precio.');
  });
});
