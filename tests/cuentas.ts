import type { SupabaseClient, User } from '@supabase/supabase-js';

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

/** Todas las cuentas de Supabase Auth: listUsers devuelve una pagina por pedido. */
export async function listarCuentas(cliente: SupabaseClient, porPagina = 1000): Promise<User[]> {
  const cuentas: User[] = [];
  for (let pagina = 1; ; pagina += 1) {
    const { data, error } = await cliente.auth.admin.listUsers({
      page: pagina,
      perPage: porPagina,
    });
    if (error) throw new Error(`No pude listar las cuentas de prueba: ${error.message}`);
    cuentas.push(...data.users);
    if (data.users.length < porPagina) return cuentas;
  }
}

async function crearCuenta(cliente: SupabaseClient, email: string, password: string) {
  // email_confirm evita depender de que la confirmacion por mail este apagada.
  const { error } = await cliente.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(`No pude crear la cuenta ${email}: ${error.message}`);
}

// Si la contrasena de .env.local cambio, la cuenta vieja quedaria afuera sin aviso.
async function repararCuenta(cliente: SupabaseClient, id: string, password: string) {
  const { error } = await cliente.auth.admin.updateUserById(id, { password, email_confirm: true });
  if (error) throw new Error(`No pude reparar la cuenta de prueba ${id}: ${error.message}`);
}

/** Repara la cuenta si ya existe o la crea si falta. Devuelve si la creo. */
async function asegurarCuenta(
  cliente: SupabaseClient,
  email: string,
  contrasena: string,
  id: string | undefined,
): Promise<boolean> {
  if (id) {
    await repararCuenta(cliente, id, contrasena);
    return false;
  }
  await crearCuenta(cliente, email, contrasena);
  return true;
}

/** Crea las cuentas de prueba que falten, repara las que ya estaban y devuelve las creadas. */
export async function sembrarCuentas(
  cliente: SupabaseClient,
  contrasena: string,
): Promise<string[]> {
  // Supabase guarda el email en minusculas: se compara asi para no recrear adminOtroLocal.
  const cuentas = await listarCuentas(cliente);
  const ids = new Map(cuentas.map((cuenta) => [(cuenta.email ?? '').toLowerCase(), cuenta.id]));
  const creadas: string[] = [];
  for (const email of ROLES_DE_PRUEBA.map(emailDePrueba)) {
    const id = ids.get(email.toLowerCase());
    if (await asegurarCuenta(cliente, email, contrasena, id)) creadas.push(email);
  }
  return creadas;
}
