import { describe, expect, it } from 'vitest';
import { MENSAJES, mensajeDeError } from './errores';

describe('mensajeDeError', () => {
  it.each([
    ['invalid_credentials', MENSAJES.credenciales],
    ['user_banned', MENSAJES.desactivada],
    ['email_exists', MENSAJES.emailExistente],
    ['user_already_exists', MENSAJES.emailExistente],
    ['23505', MENSAJES.emailExistente],
    ['weak_password', MENSAJES.contrasenaCorta],
    ['same_password', MENSAJES.mismaContrasena],
    ['over_request_rate_limit', MENSAJES.demasiadosIntentos],
    ['PM001', MENSAJES.noASiMismo],
    ['PM002', MENSAJES.ultimoAdmin],
    ['PM003', MENSAJES.emailSoloAdmin],
  ])('traduce el codigo %s', (code, mensaje) => {
    expect(mensajeDeError({ code })).toBe(mensaje);
  });

  it('un codigo desconocido da el mensaje generico', () => {
    expect(mensajeDeError({ code: 'otro' })).toBe(MENSAJES.generico);
  });

  it('sin error da el mensaje generico', () => {
    expect(mensajeDeError(null)).toBe(MENSAJES.generico);
  });

  it('el mensaje de credenciales no dice cual de los dos fallo', () => {
    expect(MENSAJES.credenciales).toBe(
      'El email o la contraseña no coinciden. Revisalos e intentá de nuevo.',
    );
  });
});
