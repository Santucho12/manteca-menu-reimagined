import { describe, expect, it } from 'vitest';
import { costoParaMostrar, textoDelOrigen } from './costo';

describe('costoParaMostrar', () => {
  it('lo que va en gramos se muestra por kilo', () => {
    // $32.000 la bolsa de 25 kg: 128 centavos el gramo.
    expect(costoParaMostrar(128, 'g')).toBe('$1.280,00 el kg');
  });

  it('lo que va en mililitros se muestra por litro', () => {
    expect(costoParaMostrar(0.45, 'ml')).toBe('$4,50 el litro');
  });

  it('lo que va en unidades se muestra por unidad, redondeado al centavo', () => {
    // Un maple de 30 huevos a $5.000: 16.666,67 centavos el huevo.
    expect(costoParaMostrar(16666.666667, 'unidad')).toBe('$166,67 la unidad');
  });

  it('la mitad de un centavo redondea hacia arriba', () => {
    expect(costoParaMostrar(0.0125, 'g')).toBe('$0,13 el kg');
  });

  it('sin costo no muestra nada', () => {
    expect(costoParaMostrar(null, 'g')).toBeNull();
  });
});

describe('textoDelOrigen', () => {
  it('una compra dice de que dia es', () => {
    expect(textoDelOrigen('compra', '2026-11-12')).toBe('Compra del 12/11');
  });

  it('el precio de referencia lo dice', () => {
    expect(textoDelOrigen('referencia', null)).toBe('Precio de referencia');
  });

  it('sin origen, no tiene precio', () => {
    expect(textoDelOrigen(null, null)).toBe('Sin precio');
  });
});
