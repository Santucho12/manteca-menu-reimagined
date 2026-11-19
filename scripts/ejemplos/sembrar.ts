import type { Cliente } from '../../src/lib/supabase/cliente';
import { iniciarSesion } from '../../tests/iniciar-sesion';
import { idDelLocalPrincipal } from '../../tests/locales';
import { borrarDatosDeEjemplo, borrarLocalDeEjemplo } from './borrar';
import { asegurarCuentaDeEjemplo, cuentasDeEjemplo } from './cuentas';
import {
  escribirCierres,
  escribirGastos,
  escribirProveedores,
  escribirVentas,
  marcarSinAbrir,
} from './escribir';
import { asegurarCatalogos, asegurarLocal, formasDelLocal } from './local';
import { copiarMenu } from './menu';
import { planDeEjemplo, type PlanDeEjemplo } from './plan';

export { borrarLocalDeEjemplo };

export type OpcionesDeEjemplo = {
  hoy: string;
  dias: number;
  semilla: number;
  /** El nombre del local de ejemplo: nunca es el principal. */
  local: string;
  /** El comienzo del email de sus cuentas: "ejemplo" da ejemplo.caja@manteca.test. */
  prefijo: string;
  contrasena: string;
};

export type ResumenDeEjemplo = {
  localId: string;
  ventas: number;
  cierres: number;
  gastos: number;
  sinAbrir: string[];
};

type Sesiones = { admin: Cliente; caja: Cliente };

async function prepararLocal(secreto: Cliente, opciones: OpcionesDeEjemplo) {
  const localId = await asegurarLocal(secreto, opciones.local);
  await asegurarCatalogos(secreto, localId);
  await copiarMenu(secreto, await idDelLocalPrincipal(secreto), localId);
  const [admin, caja] = cuentasDeEjemplo(opciones.prefijo);
  await asegurarCuentaDeEjemplo(secreto, admin!, opciones.contrasena, localId);
  const cajaId = await asegurarCuentaDeEjemplo(secreto, caja!, opciones.contrasena, localId);
  return { localId, cajaId };
}

async function sesionesDeEjemplo(opciones: OpcionesDeEjemplo): Promise<Sesiones> {
  const [admin, caja] = cuentasDeEjemplo(opciones.prefijo);
  return {
    admin: await iniciarSesion(admin!.email, opciones.contrasena),
    caja: await iniciarSesion(caja!.email, opciones.contrasena),
  };
}

async function canalDelMostrador(secreto: Cliente, localId: string): Promise<string> {
  const { data, error } = await secreto
    .from('canales_de_venta')
    .select('id')
    .eq('local_id', localId)
    .eq('de_sistema', true)
    .single();
  if (error) throw new Error(`El local de ejemplo no tiene Local: ${error.message}`);
  return data.id;
}

type Destino = { local: string; cajaId: string; canalId: string };

async function escribirPlan(
  secreto: Cliente,
  destino: Destino,
  sesiones: Sesiones,
  plan: PlanDeEjemplo,
) {
  await escribirVentas(secreto, destino, plan.ventas);
  await escribirCierres(sesiones.caja, plan.cierres);
  await marcarSinAbrir(sesiones.admin, plan.sinAbrir);
  await escribirProveedores(sesiones.admin, destino.local);
  await escribirGastos(sesiones.admin, destino.local, plan.gastos);
}

// Los gastos de caja de cada cierre también quedan en Gastos, como Sin clasificar.
const resumenDe = (localId: string, plan: PlanDeEjemplo): ResumenDeEjemplo => ({
  localId,
  ventas: plan.ventas.length,
  cierres: plan.cierres.length,
  gastos: plan.gastos.length + plan.cierres.reduce((s, c) => s + c.gastos.length, 0),
  sinAbrir: plan.sinAbrir,
});

/**
 * Arma (o vuelve a armar) el local de ejemplo en la base de pruebas: su menú copiado del
 * principal, sus cuentas, y las ventas, los cierres y los gastos inventados del período.
 */
export async function sembrarEjemplos(
  secreto: Cliente,
  opciones: OpcionesDeEjemplo,
): Promise<ResumenDeEjemplo> {
  const { localId, cajaId } = await prepararLocal(secreto, opciones);
  const sesiones = await sesionesDeEjemplo(opciones);
  await borrarDatosDeEjemplo(secreto, localId);
  const formas = await formasDelLocal(sesiones.caja);
  const plan = planDeEjemplo(opciones.semilla, opciones.hoy, formas, opciones.dias);
  const destino = { local: localId, cajaId, canalId: await canalDelMostrador(secreto, localId) };
  await escribirPlan(secreto, destino, sesiones, plan);
  return resumenDe(localId, plan);
}
