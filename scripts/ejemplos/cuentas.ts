import type { Cliente } from '../../src/lib/supabase/cliente';
import { asegurarContrasenaDeSiembra, crearCuenta, listarCuentas } from '../../tests/cuentas';

export type CuentaDeEjemplo = { email: string; nombre: string; rol: 'admin' | 'caja' };

// "ejemplo" da Ejemplo Caja; "ejemplo.prueba", Ejemplo Caja (prueba).
const sufijoDe = (prefijo: string) =>
  prefijo
    .split('.')
    .slice(1)
    .map((parte) => ` (${parte})`)
    .join('');

export const cuentasDeEjemplo = (prefijo: string): CuentaDeEjemplo[] => [
  {
    email: `${prefijo}.admin@manteca.test`,
    nombre: `Ejemplo Admin${sufijoDe(prefijo)}`,
    rol: 'admin',
  },
  {
    email: `${prefijo}.caja@manteca.test`,
    nombre: `Ejemplo Caja${sufijoDe(prefijo)}`,
    rol: 'caja',
  },
];

async function idDeLaCuenta(secreto: Cliente, email: string, contrasena: string) {
  const existente = (await listarCuentas(secreto)).find((c) => c.email === email.toLowerCase());
  if (!existente) return crearCuenta(secreto, email, contrasena);
  await asegurarContrasenaDeSiembra(secreto, existente, contrasena);
  return existente.id;
}

/** La cuenta de ejemplo, con la contraseña de las de prueba, activa y en el local de ejemplo. */
export async function asegurarCuentaDeEjemplo(
  secreto: Cliente,
  cuenta: CuentaDeEjemplo,
  contrasena: string,
  localId: string,
): Promise<string> {
  const id = await idDeLaCuenta(secreto, cuenta.email, contrasena);
  const perfil = { nombre: cuenta.nombre, rol: cuenta.rol, activo: true, local_id: localId };
  const { error } = await secreto
    .from('perfiles')
    .update({ ...perfil, debe_cambiar_contrasena: false })
    .eq('id', id);
  if (error) throw new Error(`No pude ajustar la cuenta ${cuenta.email}: ${error.message}`);
  return id;
}

/** Borra las cuentas de ejemplo: su perfil se va con ellas. */
export async function borrarCuentasDeEjemplo(secreto: Cliente, prefijo: string): Promise<void> {
  const emails = cuentasDeEjemplo(prefijo).map((c) => c.email);
  for (const cuenta of await listarCuentas(secreto)) {
    if (emails.includes(cuenta.email ?? '')) await secreto.auth.admin.deleteUser(cuenta.id);
  }
}
