import { createHash } from 'node:crypto';
import type { User } from '@supabase/supabase-js';
import type { Rol } from '../src/lib/acceso/estados';
import type { Cliente } from '../src/lib/supabase/cliente';
import { asegurarLocalB, idDelLocalPrincipal } from './locales';

export const ROLES_DE_PRUEBA = [
  'invitado',
  'caja',
  'encargado',
  'admin',
  'adminOtroLocal',
  'desactivado',
] as const;

export type RolDePrueba = (typeof ROLES_DE_PRUEBA)[number];

type PerfilDePrueba = { nombre: string; rol: Rol; activo: boolean; otroLocal: boolean };
type Locales = { principal: string; otro: string };

// desactivado es un admin inactivo, sin bloquear en Auth: prueba que RLS lo frena con la
// sesion abierta.
export const PERFILES_DE_PRUEBA: Record<RolDePrueba, PerfilDePrueba> = {
  invitado: { nombre: 'Prueba Invitado', rol: 'invitado', activo: true, otroLocal: false },
  caja: { nombre: 'Prueba Caja', rol: 'caja', activo: true, otroLocal: false },
  encargado: { nombre: 'Prueba Encargado', rol: 'encargado', activo: true, otroLocal: false },
  admin: { nombre: 'Prueba Admin', rol: 'admin', activo: true, otroLocal: false },
  adminOtroLocal: {
    nombre: 'Prueba Admin Otro Local',
    rol: 'admin',
    activo: true,
    otroLocal: true,
  },
  desactivado: { nombre: 'Prueba Desactivado', rol: 'admin', activo: false, otroLocal: false },
};

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

async function crearCuenta(cliente: Cliente, email: string, password: string): Promise<string> {
  // email_confirm evita depender de que la confirmacion por mail este apagada.
  const { data, error } = await cliente.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { huella_siembra: huellaDe(password) },
  });
  if (error || !data.user) throw new Error(`No pude crear la cuenta ${email}: ${error?.message}`);
  return data.user.id;
}

// Supabase Auth cierra todas las sesiones de una cuenta cada vez que le ponen una contraseña,
// aunque sea la misma: solo se cambia si cambio la de .env.local. La accion anotada le dice a
// la base que la puso la siembra y no la persona.
export async function asegurarContrasenaDeSiembra(
  cliente: Cliente,
  cuenta: User,
  password: string,
) {
  if (cuenta.app_metadata?.huella_siembra === huellaDe(password)) return;
  const anotada = await cliente
    .from('acciones_de_cuenta')
    .insert({ cuenta_id: cuenta.id, tipo: 'siembra', por: null });
  if (anotada.error) throw new Error(`No pude anotar la siembra: ${anotada.error.message}`);
  const { error } = await cliente.auth.admin.updateUserById(cuenta.id, {
    password,
    app_metadata: { huella_siembra: huellaDe(password) },
  });
  if (error) throw new Error(`No pude reparar la cuenta de prueba ${cuenta.id}: ${error.message}`);
}

async function asegurarCuenta(cliente: Cliente, email: string, password: string, cuenta?: User) {
  if (!cuenta) return { id: await crearCuenta(cliente, email, password), creada: true };
  await asegurarContrasenaDeSiembra(cliente, cuenta, password);
  return { id: cuenta.id, creada: false };
}

async function ajustarPerfil(
  cliente: Cliente,
  id: string,
  deseado: PerfilDePrueba,
  locales: Locales,
) {
  const { nombre, rol, activo, otroLocal } = deseado;
  const local_id = otroLocal ? locales.otro : locales.principal;
  const cambios = { nombre, rol, activo, local_id, debe_cambiar_contrasena: false };
  const { error } = await cliente.from('perfiles').update(cambios).eq('id', id);
  if (error) throw new Error(`No pude ajustar el perfil de prueba ${id}: ${error.message}`);
}

/** Crea las cuentas de prueba que falten, repara su contraseña y les deja rol, local y estado. */
export async function sembrarCuentas(cliente: Cliente, contrasena: string): Promise<string[]> {
  // Supabase guarda el email en minusculas: se compara asi para no recrear adminOtroLocal.
  const cuentas = await listarCuentas(cliente);
  const porEmail = new Map(cuentas.map((cuenta) => [(cuenta.email ?? '').toLowerCase(), cuenta]));
  const locales = {
    principal: await idDelLocalPrincipal(cliente),
    otro: await asegurarLocalB(cliente),
  };
  const creadas: string[] = [];
  // admin primero: el local principal tiene un admin activo antes de tocar al resto.
  const orden = ['admin', ...ROLES_DE_PRUEBA.filter((rol) => rol !== 'admin')] as RolDePrueba[];
  for (const rol of orden) {
    const email = emailDePrueba(rol);
    const { id, creada } = await asegurarCuenta(
      cliente,
      email,
      contrasena,
      porEmail.get(email.toLowerCase()),
    );
    await ajustarPerfil(cliente, id, PERFILES_DE_PRUEBA[rol], locales);
    if (creada) creadas.push(email);
  }
  return creadas;
}
