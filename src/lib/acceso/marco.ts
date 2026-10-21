import { enlacesDelPanel, type EnlaceDelPanel, type EstadoDeAcceso } from './estados';

export type EnlaceDelMarco = EnlaceDelPanel & { insignia: number | null };
/** Lo que espera al admin en cada seccion: los mismos casos que los avisos de Inicio. */
export type PendientesDelMarco = { usuarios: number; caja: number; gastos: number };

const conNumero = (n: number | undefined) => (n && n > 0 ? n : null);

/** Los enlaces del marco. Al admin, Caja, Gastos y Usuarios le dicen cuanto hay pendiente. */
export function enlacesDelMarco(
  estado: EstadoDeAcceso,
  pendientes: PendientesDelMarco,
): EnlaceDelMarco[] {
  const deAdmin = estado === 'admin';
  return enlacesDelPanel(estado).map((enlace) => ({
    ...enlace,
    insignia: deAdmin ? conNumero(pendientes[enlace.clave as keyof PendientesDelMarco]) : null,
  }));
}
