import { inject } from 'vitest';
import type { Cliente } from '../src/lib/supabase/cliente';
import { crearClienteSinSesion } from '../src/lib/supabase/sin-sesion';
import { comprobarBaseDePruebas } from './clientes';
import type { RolDePrueba } from './cuentas';

const clientes = new Map<RolDePrueba, Promise<Cliente>>();

async function conLaSesionDe(rol: RolDePrueba): Promise<Cliente> {
  const cliente = crearClienteSinSesion();
  const { error } = await cliente.auth.setSession(inject('sesionesDePrueba')[rol]);
  if (error) throw new Error(`No pude usar la sesion de ${rol}: ${error.message}`);
  return cliente;
}

/**
 * Cliente con la sesion de una cuenta de prueba, sobre la clave publicable: la misma
 * superficie que usa un atacante. Usa la sesion que abrio la preparacion, una por rol.
 */
export async function clienteComo(rol: RolDePrueba): Promise<Cliente> {
  comprobarBaseDePruebas();
  const existente = clientes.get(rol);
  if (existente) return existente;
  const nuevo = conLaSesionDe(rol);
  clientes.set(rol, nuevo);
  return nuevo;
}
