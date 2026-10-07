import { describe, expect, it } from 'vitest';
import { exito, fallo } from './resultado';

describe('resultado', () => {
  it('exito lleva los datos', () => {
    expect(exito(3)).toEqual({ ok: true, datos: 3 });
  });

  it('fallo lleva el mensaje para la persona', () => {
    expect(fallo('No se pudo.')).toEqual({ ok: false, mensaje: 'No se pudo.' });
  });
});
