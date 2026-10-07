import type { SupabaseClient } from '@supabase/supabase-js';

export const ROLES_DE_PRUEBA = [
  'invitado',
  'caja',
  'encargado',
  'admin',
  'adminOtroLocal',
  'desactivado',
] as const;

export type RolDePrueba = (typeof ROLES_DE_PRUEBA)[number];

export function emailDePrueba(rol: RolDePrueba): string {
  return `prueba.${rol}@manteca.test`;
}

async function emailsExistentes(cliente: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await cliente.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(`No pude listar las cuentas de prueba: ${error.message}`);
  return new Set(data.users.map((usuario) => (usuario.email ?? '').toLowerCase()));
}

async function crearCuenta(cliente: SupabaseClient, email: string, password: string) {
  // email_confirm evita depender de que la confirmacion por mail este apagada.
  const { error } = await cliente.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(`No pude crear la cuenta ${email}: ${error.message}`);
}

/** Crea las cuentas de prueba que falten y devuelve los emails que creo. */
export async function sembrarCuentas(
  cliente: SupabaseClient,
  contrasena: string,
): Promise<string[]> {
  const existentes = await emailsExistentes(cliente);
  // Supabase guarda el email en minusculas: se compara asi para no recrear adminOtroLocal.
  const faltantes = ROLES_DE_PRUEBA.map(emailDePrueba).filter(
    (email) => !existentes.has(email.toLowerCase()),
  );
  for (const email of faltantes) {
    await crearCuenta(cliente, email, contrasena);
  }
  return faltantes;
}
