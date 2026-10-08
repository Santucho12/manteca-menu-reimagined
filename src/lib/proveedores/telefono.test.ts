import { describe, expect, it } from 'vitest';
import { normalizarTelefono, telefonoParaMostrar, urlDeWhatsApp } from './telefono';

describe('normalizarTelefono', () => {
  it.each([
    '11 2345-6789',
    '011 2345 6789',
    '+54 9 11 2345 6789',
    '54 11 2345 6789',
    '5491123456789',
    '(011) 2345-6789',
  ])('%s queda en formato internacional', (texto) => {
    expect(normalizarTelefono(texto)).toBe('5491123456789');
  });

  it('vacio es sin telefono', () => {
    expect(normalizarTelefono('  ')).toBeNull();
  });

  it.each([
    '123',
    '11 15 2345 6789',
    '23456789',
    'llamar al local',
    '+54 9 15 2345 6789',
    '+54 15 2345 6789',
  ])('%s no se acepta', (texto) => {
    expect(normalizarTelefono(texto)).toBeUndefined();
  });
});

describe('WhatsApp y vista', () => {
  it('el boton abre el chat con ese numero', () => {
    expect(urlDeWhatsApp('5491123456789')).toBe('https://wa.me/5491123456789');
  });

  it('se muestra legible', () => {
    expect(telefonoParaMostrar('5491123456789')).toBe('+54 9 11 2345-6789');
  });
});
