import type { PerfilDeAcceso } from '../acceso/estados';
import { exito, fallo, type Resultado } from '../resultado';
import type { Cliente } from '../supabase/cliente';
import { perfilPropio } from './consultas';
import { crearContrasenaTemporal } from './contrasenas';
import { MENSAJES, mensajeDeError } from './errores';
import type { DatosDeAsignarRol, DatosDeCorreccion } from './esquemas';

export type DatosDeTemporal = { temporal: string; nombre: string };

type Cuenta = Pick<PerfilDeAcceso, 'id' | 'nombre' | 'email'>;
type Contexto = { admin: PerfilDeAcceso; cuenta: Cuenta };
type CambioDePerfil = { rol?: 'invitado' | 'caja' | 'admin'; activo?: boolean; nombre?: string };

// Supabase Auth no tiene un bloqueo sin vencimiento: cien años alcanzan.
const BLOQUEO = '876000h';

// Toda accion empieza aca. Sin un admin activo no se sigue, y menos con la clave secreta.
async function prepararAccion(cliente: Cliente, id: string): Promise<Resultado<Contexto>> {
  const admin = await perfilPropio(cliente);
  if (!admin || admin.rol !== 'admin' || !admin.activo) return fallo(MENSAJES.sinPermiso);
  // RLS solo le deja ver las cuentas de su local.
  const { data: cuenta, error } = await cliente
    .from('perfiles')
    .select('id, nombre, email')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`No pudimos leer la cuenta: ${error.message}`);
  return cuenta ? exito({ admin, cuenta }) : fallo(MENSAJES.cuentaNoEncontrada);
}

async function cambiarPerfil(
  cliente: Cliente,
  id: string,
  cambio: CambioDePerfil,
): Promise<Resultado> {
  const { error } = await cliente.from('perfiles').update(cambio).eq('id', id);
  return error ? fallo(mensajeDeError(error)) : exito(undefined);
}

async function bloquear(secreto: Cliente, id: string, duracion: string): Promise<Resultado> {
  const { error } = await secreto.auth.admin.updateUserById(id, { ban_duration: duracion });
  return error ? fallo(mensajeDeError(error)) : exito(undefined);
}

type Accion = { cuenta: string; tipo: 'reseteo' | 'correccion'; por: string };
type CambioEnAuth = () => Promise<{ error: { code?: string | null } | null }>;

// Le avisa a la base que el proximo cambio de contraseña o de email de la cuenta lo pidio este admin.
async function anotarAccion(secreto: Cliente, { cuenta, tipo, por }: Accion): Promise<string> {
  const { data, error } = await secreto
    .from('acciones_de_cuenta')
    .insert({ cuenta_id: cuenta, tipo, por })
    .select('id')
    .single();
  if (error) throw new Error(`No pudimos anotar la accion: ${error.message}`);
  return data.id;
}

// Si Auth no hizo el cambio, la marca se da por usada: viva, la tomaria el proximo cambio
// de la cuenta, aunque lo haga la persona y no el admin.
async function conAccionAnotada(
  secreto: Cliente,
  accion: Accion,
  cambio: CambioEnAuth,
): Promise<Resultado> {
  const id = await anotarAccion(secreto, accion);
  const { error } = await cambio();
  if (!error) return exito(undefined);
  const descarte = await secreto
    .from('acciones_de_cuenta')
    .update({ fecha_uso: new Date().toISOString() })
    .eq('id', id);
  if (descarte.error) throw new Error(`No pudimos descartar la accion: ${descarte.error.message}`);
  return fallo(mensajeDeError(error));
}

// Con la clave secreta: el email no puede repetirse en ningun local.
async function emailOcupado(secreto: Cliente, email: string): Promise<boolean> {
  const { count, error } = await secreto
    .from('perfiles')
    .select('id', { count: 'exact', head: true })
    .eq('email', email);
  if (error) throw new Error(`No pudimos revisar el email: ${error.message}`);
  return (count ?? 0) > 0;
}

export async function asignarRol(
  cliente: Cliente,
  { id, rol }: DatosDeAsignarRol,
): Promise<Resultado> {
  const previa = await prepararAccion(cliente, id);
  return previa.ok ? cambiarPerfil(cliente, id, { rol }) : previa;
}

/** Desactiva y bloquea en Auth: pierde el acceso aunque tenga la sesion abierta. Rechazar es esto. */
export async function desactivar(
  cliente: Cliente,
  secreto: Cliente,
  id: string,
): Promise<Resultado> {
  const previa = await prepararAccion(cliente, id);
  if (!previa.ok) return previa;
  // Primero el perfil: la base frena al ultimo admin antes de que se bloquee a nadie.
  const cambio = await cambiarPerfil(cliente, id, { activo: false });
  return cambio.ok ? bloquear(secreto, id, BLOQUEO) : cambio;
}

export async function reactivar(
  cliente: Cliente,
  secreto: Cliente,
  id: string,
): Promise<Resultado> {
  const previa = await prepararAccion(cliente, id);
  if (!previa.ok) return previa;
  // Primero el desbloqueo: si falla, el perfil sigue inactivo y la lista sigue ofreciendo
  // Reactivar. Al reves, la lista diria "Activa" con la cuenta todavia bloqueada.
  const desbloqueo = await bloquear(secreto, id, 'none');
  return desbloqueo.ok ? cambiarPerfil(cliente, id, { activo: true }) : desbloqueo;
}

export async function resetearContrasena(
  cliente: Cliente,
  secreto: Cliente,
  id: string,
): Promise<Resultado<DatosDeTemporal>> {
  const previa = await prepararAccion(cliente, id);
  if (!previa.ok) return previa;
  if (previa.datos.admin.id === id) return fallo(MENSAJES.propiaContrasena);
  const temporal = crearContrasenaTemporal();
  const reseteo = await conAccionAnotada(
    secreto,
    { cuenta: id, tipo: 'reseteo', por: previa.datos.admin.id },
    () => secreto.auth.admin.updateUserById(id, { password: temporal }),
  );
  return reseteo.ok ? exito({ temporal, nombre: previa.datos.cuenta.nombre }) : reseteo;
}

export async function corregir(
  cliente: Cliente,
  secreto: Cliente,
  datos: DatosDeCorreccion,
): Promise<Resultado> {
  const previa = await prepararAccion(cliente, datos.id);
  if (!previa.ok) return previa;
  const cambiaEmail = datos.email !== previa.datos.cuenta.email;
  if (cambiaEmail && (await emailOcupado(secreto, datos.email)))
    return fallo(MENSAJES.emailExistente);
  const nombre = await cambiarPerfil(cliente, datos.id, { nombre: datos.nombre });
  if (!nombre.ok || !cambiaEmail) return nombre;
  return conAccionAnotada(
    secreto,
    { cuenta: datos.id, tipo: 'correccion', por: previa.datos.admin.id },
    () => secreto.auth.admin.updateUserById(datos.id, { email: datos.email, email_confirm: true }),
  );
}
