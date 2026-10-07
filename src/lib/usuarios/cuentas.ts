import { exito, fallo, type Resultado } from '../resultado';
import type { Cliente } from '../supabase/cliente';
import { crearClienteSinSesion } from '../supabase/sin-sesion';
import { perfilPropio } from './consultas';
import { MENSAJES, mensajeDeError } from './errores';
import type {
  DatosDeCambioDeContrasena,
  DatosDeCambioObligado,
  DatosDeIngreso,
  DatosDeRegistro,
} from './esquemas';

function resultadoDe(error: { code?: string | null } | null): Resultado {
  return error ? fallo(mensajeDeError(error)) : exito(undefined);
}

/** Crea la cuenta y deja la sesion iniciada: la confirmacion de email esta apagada. */
export async function registrar(cliente: Cliente, datos: DatosDeRegistro): Promise<Resultado> {
  const { error } = await cliente.auth.signUp({
    email: datos.email,
    password: datos.contrasena,
    options: { data: { nombre: datos.nombre } },
  });
  return resultadoDe(error);
}

export async function ingresar(cliente: Cliente, datos: DatosDeIngreso): Promise<Resultado> {
  const { error } = await cliente.auth.signInWithPassword({
    email: datos.email,
    password: datos.contrasena,
  });
  return resultadoDe(error);
}

// Se comprueba con un cliente aparte, para no tocar la sesion de la persona.
async function contrasenaCoincide(email: string, contrasena: string): Promise<boolean> {
  const aparte = crearClienteSinSesion();
  const { error } = await aparte.auth.signInWithPassword({ email, password: contrasena });
  if (!error) await aparte.auth.signOut({ scope: 'local' });
  return !error;
}

async function actualizarContrasena(cliente: Cliente, nueva: string): Promise<Resultado> {
  const { error } = await cliente.auth.updateUser({ password: nueva });
  return resultadoDe(error);
}

/** Desde Mi cuenta: pide la contraseña actual. */
export async function cambiarContrasena(
  cliente: Cliente,
  datos: DatosDeCambioDeContrasena,
): Promise<Resultado> {
  const perfil = await perfilPropio(cliente);
  if (!perfil) return fallo(MENSAJES.sesionVencida);
  if (!(await contrasenaCoincide(perfil.email, datos.actual))) {
    return fallo(MENSAJES.actualNoCoincide);
  }
  return actualizarContrasena(cliente, datos.nueva);
}

/** Despues de un reseteo: no pide la actual, y solo sirve mientras el cambio sea obligatorio. */
export async function cambiarContrasenaObligada(
  cliente: Cliente,
  datos: DatosDeCambioObligado,
): Promise<Resultado> {
  const perfil = await perfilPropio(cliente);
  if (!perfil) return fallo(MENSAJES.sesionVencida);
  if (!perfil.debe_cambiar_contrasena) return fallo(MENSAJES.sinPermiso);
  return actualizarContrasena(cliente, datos.nueva);
}

/** Cierra la sesion de este dispositivo; las de los otros siguen abiertas. */
export async function salir(cliente: Cliente): Promise<void> {
  await cliente.auth.signOut({ scope: 'local' });
}
