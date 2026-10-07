import { randomUUID } from 'node:crypto';
import type { Rol } from '../src/lib/acceso/estados';
import type { Cliente } from '../src/lib/supabase/cliente';
import { clienteSecretoDePruebas } from './clientes';
import { iniciarSesion } from './iniciar-sesion';
import { asegurarLocalB, idDelLocalPrincipal } from './locales';

export type CuentaTemporal = { id: string; email: string; contrasena: string };
export type OpcionesDeCuenta = { rol?: Rol; activo?: boolean; otroLocal?: boolean };

async function ajustarPerfil(secreto: Cliente, id: string, opciones: OpcionesDeCuenta) {
  const local_id = opciones.otroLocal
    ? await asegurarLocalB(secreto)
    : await idDelLocalPrincipal(secreto);
  const cambios = { rol: opciones.rol ?? 'invitado', activo: opciones.activo ?? true, local_id };
  const { error } = await secreto.from('perfiles').update(cambios).eq('id', id);
  if (error) throw new Error(`No pude ajustar la cuenta temporal: ${error.message}`);
}

/** Una cuenta descartable, con el rol y el estado pedidos. La borra borrarCuentaTemporal. */
export async function crearCuentaTemporal(
  opciones: OpcionesDeCuenta = {},
): Promise<CuentaTemporal> {
  const secreto = clienteSecretoDePruebas();
  const cuenta = { email: `temporal.${randomUUID()}@manteca.test`, contrasena: randomUUID() };
  const { data, error } = await secreto.auth.admin.createUser({
    email: cuenta.email,
    password: cuenta.contrasena,
    email_confirm: true,
    user_metadata: { nombre: 'Cuenta temporal' },
  });
  if (error || !data.user) throw new Error(`No pude crear la cuenta temporal: ${error?.message}`);
  await ajustarPerfil(secreto, data.user.id, opciones);
  return { ...cuenta, id: data.user.id };
}

export function clienteDe(cuenta: CuentaTemporal): Promise<Cliente> {
  return iniciarSesion(cuenta.email, cuenta.contrasena);
}

/** Borra la cuenta, su perfil y la auditoria que dejo. Solo en la base de pruebas. */
export async function borrarCuentaTemporal(id: string): Promise<void> {
  const secreto = clienteSecretoDePruebas();
  await secreto.from('auditoria').delete().or(`registro_id.eq.${id},usuario_id.eq.${id}`);
  const { error } = await secreto.auth.admin.deleteUser(id);
  if (error) throw new Error(`No pude borrar la cuenta temporal: ${error.message}`);
}

/** Borra la cuenta con ese email, si existe: la crea la pantalla de registro y el test pudo fallar antes. */
export async function borrarCuentaPorEmail(email: string): Promise<void> {
  const { data, error } = await clienteSecretoDePruebas()
    .from('perfiles')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle();
  if (error) throw new Error(`No pude buscar la cuenta ${email}: ${error.message}`);
  if (data) await borrarCuentaTemporal(data.id);
}
