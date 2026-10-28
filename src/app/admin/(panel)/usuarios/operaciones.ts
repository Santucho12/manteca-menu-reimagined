import type { Resultado } from '@/lib/resultado';
import type { AccionDeUsuario } from '@/lib/usuarios/presentacion';
import { darRol, desactivarCuenta, reactivarCuenta, resetearContrasenaDe } from './acciones';

export type Operable = Exclude<AccionDeUsuario, 'corregir'>;
type Operacion = (id: string) => Promise<Resultado<{ temporal?: string } | undefined>>;

/** Lo que hace en el servidor cada boton de una cuenta. Corregir tiene su propio formulario. */
export const OPERACIONES: Record<Operable, Operacion> = {
  darCaja: (id) => darRol({ id, rol: 'caja' }),
  darAdmin: (id) => darRol({ id, rol: 'admin' }),
  darPendiente: (id) => darRol({ id, rol: 'invitado' }),
  rechazar: (id) => desactivarCuenta({ id }),
  desactivar: (id) => desactivarCuenta({ id }),
  reactivar: (id) => reactivarCuenta({ id }),
  resetear: (id) => resetearContrasenaDe({ id }),
};
