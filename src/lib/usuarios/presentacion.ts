import type { PerfilDeAcceso, Rol } from '../acceso/estados';

export type EstadoDeCuenta = 'Pendiente' | 'Activa' | 'Desactivada' | 'Rechazada';
export type AccionDeUsuario =
  'darCaja' | 'darAdmin' | 'rechazar' | 'desactivar' | 'reactivar' | 'resetear' | 'corregir';
export type FiltroDeEstado = 'todos' | 'pendientes' | 'activos' | 'desactivados';
export type FiltrosDeLista = { busqueda: string | null; estado: FiltroDeEstado; pagina: number };
export type FilaDeUsuario = Pick<PerfilDeAcceso, 'id' | 'nombre' | 'email' | 'rol' | 'activo'>;

export const POR_PAGINA = 25;

export const OPCIONES_DE_ESTADO: { valor: FiltroDeEstado; texto: string }[] = [
  { valor: 'todos', texto: 'Todos' },
  { valor: 'pendientes', texto: 'Esperando rol' },
  { valor: 'activos', texto: 'Activos' },
  { valor: 'desactivados', texto: 'Desactivados' },
];

export const ETIQUETAS_DE_ACCION: Record<AccionDeUsuario, string> = {
  darCaja: 'Dar rol de Caja',
  darAdmin: 'Dar rol de Admin',
  rechazar: 'Rechazar',
  desactivar: 'Desactivar',
  reactivar: 'Reactivar',
  resetear: 'Resetear contraseña',
  corregir: 'Corregir datos',
};

const NOMBRES_DE_ROL: Record<Rol, string> = {
  invitado: 'Invitado',
  caja: 'Caja',
  encargado: 'Encargado',
  admin: 'Admin',
};

const CAMBIOS_DE_ROL: Record<Rol, AccionDeUsuario[]> = {
  invitado: ['darCaja', 'darAdmin'],
  caja: ['darAdmin'],
  encargado: ['darCaja', 'darAdmin'],
  admin: ['darCaja'],
};

type Cuenta = Pick<PerfilDeAcceso, 'id' | 'rol' | 'activo'>;

export function nombreDeRol(rol: Rol): string {
  return NOMBRES_DE_ROL[rol];
}

/** Como se ve una cuenta en la lista: el invitado rechazado no es una cuenta desactivada. */
export function estadoDeCuenta({ rol, activo }: Cuenta): EstadoDeCuenta {
  if (rol === 'invitado') return activo ? 'Pendiente' : 'Rechazada';
  return activo ? 'Activa' : 'Desactivada';
}

/** Las acciones que ofrece la pantalla. La base y el servidor igual las controlan. */
export function accionesDisponibles(cuenta: Cuenta, yo: string): AccionDeUsuario[] {
  if (cuenta.id === yo) return ['corregir'];
  if (!cuenta.activo) return ['reactivar'];
  if (cuenta.rol === 'invitado') return [...CAMBIOS_DE_ROL.invitado, 'rechazar'];
  return [...CAMBIOS_DE_ROL[cuenta.rol], 'desactivar', 'resetear', 'corregir'];
}

/** El texto de busqueda sin lo que rompe un filtro de PostgREST. Vacio, null. */
export function textoDeBusqueda(texto: string | undefined): string | null {
  const limpio = (texto ?? '')
    .replace(/[,()*%\\:"]/g, ' ')
    .trim()
    .slice(0, 100);
  return limpio === '' ? null : limpio;
}

export function filtroDeEstado(valor: string | undefined): FiltroDeEstado {
  return OPCIONES_DE_ESTADO.find((opcion) => opcion.valor === valor)?.valor ?? 'todos';
}

export function numeroDePagina(valor: string | undefined): number {
  const numero = Number(valor);
  return Number.isSafeInteger(numero) && numero > 0 ? numero : 1;
}

/** De un parametro de la URL que puede venir repetido, el primero. */
export function unValor(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export function cantidadDePaginas(total: number): number {
  return Math.max(1, Math.ceil(total / POR_PAGINA));
}

export function enlaceDeUsuarios({ busqueda, estado, pagina }: FiltrosDeLista): string {
  const parametros = new URLSearchParams();
  if (busqueda) parametros.set('q', busqueda);
  if (estado !== 'todos') parametros.set('estado', estado);
  if (pagina > 1) parametros.set('pagina', String(pagina));
  const consulta = parametros.toString();
  return consulta ? `/admin/usuarios?${consulta}` : '/admin/usuarios';
}

export function textoDePendientes(cantidad: number): string {
  if (cantidad === 0) return 'No hay personas esperando un rol.';
  return cantidad === 1
    ? 'Hay 1 persona esperando un rol.'
    : `Hay ${cantidad} personas esperando un rol.`;
}
