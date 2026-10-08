import { describe, expect, it } from 'vitest';
import { atributosDeError, idDelError, nombreDelBotonDeContrasena } from './accesibilidad';

describe('atributos de un campo con error', () => {
  it('con error, marca el campo invalido y lo describe con el mensaje', () => {
    expect(atributosDeError('monto', 'Ingresá un monto.')).toEqual({
      'aria-invalid': true,
      'aria-describedby': 'monto-error',
    });
  });

  it('sin error no agrega nada', () => {
    expect(atributosDeError('monto', undefined)).toEqual({});
  });

  it('el mensaje lleva el id con el que el campo lo nombra', () => {
    expect(idDelError('monto')).toBe('monto-error');
  });
});

describe('boton de una contraseña', () => {
  it.each([
    ['Contraseña', false, 'Mostrar contraseña'],
    ['Contraseña', true, 'Ocultar contraseña'],
    ['Contraseña actual', false, 'Mostrar contraseña actual'],
  ] as const)('con la etiqueta %s y visible %s se llama %s', (etiqueta, visible, nombre) => {
    expect(nombreDelBotonDeContrasena(etiqueta, visible)).toBe(nombre);
  });
});
