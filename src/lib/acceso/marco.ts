import { enlacesDelPanel, type EnlaceDelPanel, type EstadoDeAcceso } from './estados';

export type EnlaceDelMarco = EnlaceDelPanel & { insignia: number | null };

/** Los enlaces del marco. El de Usuarios lleva cuantos esperan un rol, si hay alguno. */
export function enlacesDelMarco(estado: EstadoDeAcceso, pendientes: number): EnlaceDelMarco[] {
  return enlacesDelPanel(estado).map((enlace) => ({
    ...enlace,
    insignia: enlace.clave === 'usuarios' && pendientes > 0 ? pendientes : null,
  }));
}
