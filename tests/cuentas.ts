import { createHash } from 'node:crypto';
import type { User } from '@supabase/supabase-js';
import type { Cliente } from '../src/lib/supabase/cliente';

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

/** Huella de la contraseña de .env.local: si cambia, la siembra actualiza las cuentas. */
export function huellaDe(contrasena: string): string {
  return createHash('sha256').update(contrasena).digest('hex');
}

/** Todas las cuentas de Supabase Auth: listUsers devuelve una pagina por pedido. */
export async function listarCuentas(cliente: Cliente, porPagina = 1000): Promise<User[]> {
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

async function crearCuenta(cliente: Cliente, email: string, password: string) {
  // email_confirm evita depender de que la confirmacion por mail este apagada.
  const { error } = await cliente.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { huella_siembra: huellaDe(password) },
  });
  if (error) throw new Error(`No pude crear la cuenta ${email}: ${error.message}`);
}

// Supabase Auth cierra todas las sesiones de una cuenta cada vez que le ponen una contraseña,
// aunque sea la misma: solo se cambia si cambio la de .env.local.
export async function asegurarContrasenaDeSiembra(
  cliente: Cliente,
  cuenta: User,
  password: string,
) {
  if (cuenta.app_metadata?.huella_siembra === huellaDe(password)) return;
  const { error } = await cliente.auth.admin.updateUserById(cuenta.id, {
    password,
    email_confirm: true,
    app_metadata: { huella_siembra: huellaDe(password) },
  });
  if (error) throw new Error(`No pude reparar la cuenta de prueba ${cuenta.id}: ${error.message}`);
}

/** Repara la cuenta si ya existe o la crea si falta. Devuelve si la creo. */
async function asegurarCuenta(
  cliente: Cliente,
  email: string,
  contrasena: string,
  cuenta: User | undefined,
): Promise<boolean> {
  if (cuenta) {
    await asegurarContrasenaDeSiembra(cliente, cuenta, contrasena);
    return false;
  }
  await crearCuenta(cliente, email, contrasena);
  return true;
}

/** Crea las cuentas de prueba que falten, repara las que ya estaban y devuelve las creadas. */
export async function sembrarCuentas(cliente: Cliente, contrasena: string): Promise<string[]> {
  // Supabase guarda el email en minusculas: se compara asi para no recrear adminOtroLocal.
  const cuentas = await listarCuentas(cliente);
  const porEmail = new Map(cuentas.map((cuenta) => [(cuenta.email ?? '').toLowerCase(), cuenta]));
  const creadas: string[] = [];
  for (const email of ROLES_DE_PRUEBA.map(emailDePrueba)) {
    const existente = porEmail.get(email.toLowerCase());
    if (await asegurarCuenta(cliente, email, contrasena, existente)) creadas.push(email);
  }
  return creadas;
}
