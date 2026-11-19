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
  type Destino,
} from './escribir';
import { asegurarCatalogos, asegurarLocal, formasDelLocal, idsPorNombre } from './local';
import { copiarMenu } from './menu';
import { planDeEjemplo, type PlanDeEjemplo } from './plan';
import type { VentaAManoDeEjemplo, VentaDeEjemplo } from './ventas';

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

type Cuentas = { localId: string; adminId: string; cajaId: string };

async function prepararLocal(secreto: Cliente, opciones: OpcionesDeEjemplo): Promise<Cuentas> {
  const localId = await asegurarLocal(secreto, opciones.local);
  await asegurarCatalogos(secreto, localId);
  await copiarMenu(secreto, await idDelLocalPrincipal(secreto), localId);
  const [admin, caja] = cuentasDeEjemplo(opciones.prefijo);
  const adminId = await asegurarCuentaDeEjemplo(secreto, admin!, opciones.contrasena, localId);
  const cajaId = await asegurarCuentaDeEjemplo(secreto, caja!, opciones.contrasena, localId);
  return { localId, adminId, cajaId };
}

async function sesionesDeEjemplo(opciones: OpcionesDeEjemplo): Promise<Sesiones> {
  const [admin, caja] = cuentasDeEjemplo(opciones.prefijo);
  return {
    admin: await iniciarSesion(admin!.email, opciones.contrasena),
    caja: await iniciarSesion(caja!.email, opciones.contrasena),
  };
}

type Destinos = { mostrador: Destino<VentaDeEjemplo>; aMano: Destino<VentaAManoDeEjemplo> };

// Las del mostrador, de tipo Local y a nombre de la caja; las otras, a mano por el admin.
const delMostrador = (cuentas: Cuentas, canal: string): Destino<VentaDeEjemplo> => ({
  local: cuentas.localId,
  creadoPor: cuentas.cajaId,
  origen: 'mostrador',
  enLaCaja: true,
  canalDe: () => canal,
});

const aManoDelAdmin = (
  cuentas: Cuentas,
  canales: Map<string, string>,
): Destino<VentaAManoDeEjemplo> => ({
  local: cuentas.localId,
  creadoPor: cuentas.adminId,
  origen: 'manual',
  enLaCaja: false,
  canalDe: (venta) => canales.get(venta.tipo)!,
});

async function destinosDe(secreto: Cliente, cuentas: Cuentas): Promise<Destinos> {
  const canales = await idsPorNombre(secreto, 'canales_de_venta', cuentas.localId);
  return {
    mostrador: delMostrador(cuentas, canales.get('Local')!),
    aMano: aManoDelAdmin(cuentas, canales),
  };
}

async function escribirPlan(
  secreto: Cliente,
  destinos: Destinos,
  sesiones: Sesiones,
  plan: PlanDeEjemplo,
) {
  const local = destinos.mostrador.local;
  await escribirVentas(secreto, destinos.mostrador, plan.ventas);
  await escribirVentas(secreto, destinos.aMano, plan.aMano);
  await escribirCierres(sesiones.caja, plan.cierres);
  await marcarSinAbrir(sesiones.admin, plan.sinAbrir);
  await escribirProveedores(sesiones.admin, local);
  await escribirGastos(sesiones.admin, local, plan.gastos);
}

// Los gastos de caja de cada cierre también quedan en Gastos, como Sin clasificar.
const resumenDe = (localId: string, plan: PlanDeEjemplo): ResumenDeEjemplo => ({
  localId,
  ventas: plan.ventas.length + plan.aMano.length,
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
  const cuentas = await prepararLocal(secreto, opciones);
  const sesiones = await sesionesDeEjemplo(opciones);
  await borrarDatosDeEjemplo(secreto, cuentas.localId);
  const formas = await formasDelLocal(sesiones.caja);
  const plan = planDeEjemplo(opciones.semilla, opciones.hoy, formas, opciones.dias);
  await escribirPlan(secreto, await destinosDe(secreto, cuentas), sesiones, plan);
  return resumenDe(cuentas.localId, plan);
}
