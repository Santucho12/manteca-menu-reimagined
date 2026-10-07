import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { esquemaAsignarRol, esquemaCuenta, esquemaIngreso, esquemaRegistro } from './esquemas';

const ID = '5f0c7e2a-8f8f-4c6e-9b0a-2f6d1c3b4a5e';
const registro = { nombre: 'Ana', email: 'ana@manteca.test', contrasena: 'una-clave-larga' };

function mensajes(esquema: z.ZodType, valor: unknown): string[] {
  const resultado = esquema.safeParse(valor);
  return resultado.success ? [] : resultado.error.issues.map((problema) => problema.message);
}

describe('esquemas de usuarios', () => {
  it('el registro limpia el nombre y deja el email en minusculas', () => {
    const datos = esquemaRegistro.parse({
      ...registro,
      nombre: '  Ana  ',
      email: ' Ana@Manteca.TEST ',
    });
    expect(datos).toEqual(registro);
  });

  it('el ingreso tambien deja el email en minusculas', () => {
    expect(esquemaIngreso.parse({ email: 'ANA@manteca.test', contrasena: 'x' }).email).toBe(
      'ana@manteca.test',
    );
  });

  it('rechaza un nombre vacio', () => {
    expect(mensajes(esquemaRegistro, { ...registro, nombre: '   ' })).toEqual([
      'Escribí el nombre.',
    ]);
  });

  it('rechaza un email invalido', () => {
    expect(mensajes(esquemaRegistro, { ...registro, email: 'ana' })).toEqual([
      'Escribí un email válido.',
    ]);
  });

  it('rechaza una contraseña de menos de 6 caracteres', () => {
    expect(mensajes(esquemaRegistro, { ...registro, contrasena: 'corta' })).toEqual([
      'La contraseña tiene que tener al menos 6 caracteres.',
    ]);
  });

  it('rechaza una contraseña de mas de 72 caracteres, que bcrypt cortaria', () => {
    expect(mensajes(esquemaRegistro, { ...registro, contrasena: 'x'.repeat(73) })).toEqual([
      'La contraseña puede tener hasta 72 caracteres.',
    ]);
  });

  it.each(['caja', 'admin'])('asignar rol acepta %s', (rol) => {
    expect(mensajes(esquemaAsignarRol, { id: ID, rol })).toEqual([]);
  });

  it.each(['encargado', 'invitado'])('asignar rol rechaza %s', (rol) => {
    expect(mensajes(esquemaAsignarRol, { id: ID, rol })).toEqual(['Elegí Caja o Admin.']);
  });

  it('rechaza un id que no es de una cuenta', () => {
    expect(mensajes(esquemaCuenta, { id: '1' })).toEqual(['La cuenta no es válida.']);
  });
});
