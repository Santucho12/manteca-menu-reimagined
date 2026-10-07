import type { Cliente } from '../src/lib/supabase/cliente';
import { crearClienteSinSesion } from '../src/lib/supabase/sin-sesion';
import { comprobarBaseDePruebas } from './clientes';

export type Sesion = { access_token: string; refresh_token: string };

/** Inicia sesion con la clave publicable. Cada llamada cuenta contra el limite de Supabase. */
export async function iniciarSesion(email: string, password: string): Promise<Cliente> {
  comprobarBaseDePruebas();
  const cliente = crearClienteSinSesion();
  const { error } = await cliente.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`No pude entrar como ${email}: ${error.message}`);
  return cliente;
}

export async function sesionDe(cliente: Cliente): Promise<Sesion> {
  const { data } = await cliente.auth.getSession();
  if (!data.session) throw new Error('El cliente no tiene sesion.');
  return { access_token: data.session.access_token, refresh_token: data.session.refresh_token };
}
