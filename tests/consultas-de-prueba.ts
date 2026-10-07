import type { User } from '@supabase/supabase-js';
import { clienteSecretoDePruebas } from './clientes';
import { emailDePrueba, type RolDePrueba } from './cuentas';

export async function idPorEmail(email: string): Promise<string> {
  const { data, error } = await clienteSecretoDePruebas()
    .from('perfiles')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();
  if (error) throw new Error(`No encontré la cuenta ${email}: ${error.message}`);
  return data.id;
}

export function idDeCuentaDePrueba(rol: RolDePrueba): Promise<string> {
  return idPorEmail(emailDePrueba(rol));
}

export async function perfilDe(id: string) {
  const { data, error } = await clienteSecretoDePruebas()
    .from('perfiles')
    .select('nombre, email, rol, activo, debe_cambiar_contrasena, local_id')
    .eq('id', id)
    .single();
  if (error) throw new Error(`No encontré el perfil ${id}: ${error.message}`);
  return data;
}

export async function registrosDe(id: string) {
  const { data, error } = await clienteSecretoDePruebas()
    .from('auditoria')
    .select('accion, usuario_id, antes, despues')
    .eq('registro_id', id)
    .order('id');
  if (error) throw new Error(`No pude leer la auditoria de ${id}: ${error.message}`);
  return data;
}

export async function usuarioDe(id: string): Promise<User> {
  const { data, error } = await clienteSecretoDePruebas().auth.admin.getUserById(id);
  if (error || !data.user) throw new Error(`No encontré la cuenta ${id}: ${error?.message}`);
  return data.user;
}

/**
 * Lo que anota el servidor antes de cambiar la contraseña o el email de una cuenta: asi la
 * base sabe quien lo pidio. Con fechaCreacion se prueba que una accion vieja no sirve.
 */
export async function anotarAccion(
  cuentaId: string,
  tipo: 'reseteo' | 'correccion',
  por: string | null,
  fechaCreacion?: string,
): Promise<void> {
  const fila = {
    cuenta_id: cuentaId,
    tipo,
    por,
    ...(fechaCreacion ? { fecha_creacion: fechaCreacion } : {}),
  };
  const { error } = await clienteSecretoDePruebas().from('acciones_de_cuenta').insert(fila);
  if (error) throw new Error(`No pude anotar la accion: ${error.message}`);
}

/** Lo mismo que hace un admin al resetear, sin pasar por la pantalla: prepara las pruebas. */
export async function resetearComoAdmin(cuentaId: string, temporal: string): Promise<void> {
  await anotarAccion(cuentaId, 'reseteo', await idDeCuentaDePrueba('admin'));
  const { error } = await clienteSecretoDePruebas().auth.admin.updateUserById(cuentaId, {
    password: temporal,
  });
  if (error) throw new Error(`No pude resetear la cuenta ${cuentaId}: ${error.message}`);
}
