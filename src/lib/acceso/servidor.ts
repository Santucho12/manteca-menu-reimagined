import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import type { z } from 'zod';
import { exito, fallo, type Resultado } from '../resultado';
import type { Cliente } from '../supabase/cliente';
import { crearClienteDelServidor } from '../supabase/servidor';
import { contarPendientes, perfilPropio } from '../usuarios/consultas';
import { MENSAJES } from '../usuarios/errores';
import {
  destinoDe,
  estadoDeAcceso,
  type EstadoDeAcceso,
  type Pagina,
  type PerfilDeAcceso,
} from './estados';
import { diaEnArgentina } from '../fechas';
import { cierresConDiferencia, gastosSinClasificar } from '../inicio/consultas';
import { enlacesDelMarco, type EnlaceDelMarco, type PendientesDelMarco } from './marco';

export type PaginaConSesion = Exclude<Pagina, 'publica'>;
export type Acceso = { cliente: Cliente; perfil: PerfilDeAcceso; estado: EstadoDeAcceso };

// cache: el layout, la pagina y la accion de un mismo pedido leen el perfil una sola vez.
const accesoActual = cache(async () => {
  const cliente = await crearClienteDelServidor();
  const perfil = await perfilPropio(cliente);
  return { cliente, perfil, estado: estadoDeAcceso(perfil) };
});

/** Cuantos esperan un rol en el local de quien pide, leido una vez por pedido. */
export const pendientesActuales = cache((cliente: Cliente) => contarPendientes(cliente));

/** Ingreso y registro: quien ya tiene sesion va a su pantalla. */
export async function soloSinSesion(): Promise<void> {
  const destino = destinoDe((await accesoActual()).estado, 'publica');
  if (destino) redirect(destino);
}

/** Cada pagina con sesion: manda a quien no puede verla adonde le corresponde. */
export async function exigirPagina(pagina: PaginaConSesion): Promise<Acceso> {
  const { cliente, perfil, estado } = await accesoActual();
  const destino = destinoDe(estado, pagina);
  if (destino || !perfil) redirect(destino ?? '/admin/ingresar');
  return { cliente, perfil, estado };
}

/** Cada accion con sesion: el acceso, o el mensaje para la persona si no puede. */
export async function exigirAccion(pagina: PaginaConSesion): Promise<Resultado<Acceso>> {
  const { cliente, perfil, estado } = await accesoActual();
  if (!perfil) return fallo(MENSAJES.sesionVencida);
  if (estado === 'desactivado') return fallo(MENSAJES.desactivada);
  if (destinoDe(estado, pagina)) return fallo(MENSAJES.sinPermiso);
  return exito({ cliente, perfil, estado });
}

/** Lo comun de cada accion: el acceso, el mismo esquema del formulario y el panel al dia. */
export async function ejecutarAccion<T, R>(
  pagina: PaginaConSesion,
  esquema: z.ZodType<T>,
  datos: unknown,
  hacer: (acceso: Acceso, validos: T) => Promise<Resultado<R>>,
): Promise<Resultado<R>> {
  const acceso = await exigirAccion(pagina);
  if (!acceso.ok) return acceso;
  const validos = esquema.safeParse(datos);
  if (!validos.success) return fallo(MENSAJES.datosInvalidos);
  const resultado = await hacer(acceso.datos, validos.data);
  revalidatePath('/admin', 'layout');
  return resultado;
}

/** Lo que muestra el marco del panel: el nombre y los enlaces, con los pendientes del admin. */
export async function datosDelMarco({ cliente, perfil, estado }: Acceso): Promise<{
  nombre: string;
  enlaces: EnlaceDelMarco[];
}> {
  const pendientes = estado === 'admin' ? await pendientesDelAdmin(cliente) : SIN_PENDIENTES;
  return { nombre: perfil.nombre, enlaces: enlacesDelMarco(estado, pendientes) };
}

const SIN_PENDIENTES: PendientesDelMarco = { usuarios: 0, caja: 0, gastos: 0 };

// Los mismos casos que los avisos de Inicio, para que la sidebar y el Inicio digan lo mismo.
async function pendientesDelAdmin(cliente: Cliente): Promise<PendientesDelMarco> {
  const hoy = diaEnArgentina(new Date());
  const [usuarios, caja, gastos] = await Promise.all([
    pendientesActuales(cliente),
    cierresConDiferencia(cliente, hoy),
    gastosSinClasificar(cliente),
  ]);
  return { usuarios, caja: caja.cantidad, gastos: gastos.cantidad };
}
