import { enlacesDelPanel, type EnlaceDelPanel, type EstadoDeAcceso } from './estados';

export type EnlaceDelMarco = EnlaceDelPanel & { insignia: number | null };
/** Lo que espera al admin en cada seccion: los mismos casos que los avisos de Inicio. */
export type PendientesDelMarco = { usuarios: number; caja: number; gastos: number };
export type GrupoDelPanel = { titulo: string | null; enlaces: EnlaceDelMarco[] };

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

// Por momento del dia: lo de todos los dias, lo de la plata y lo que se configura de vez en cuando.
const GRUPOS = [
  { titulo: 'Día a día', claves: ['inicio', 'ventas', 'caja'] },
  { titulo: 'Plata', claves: ['gastos', 'proveedores', 'reportes'] },
  { titulo: 'Ajustes', claves: ['menu', 'usuarios', 'auditoria'] },
];
const AL_PIE = ['cuenta'];

/** Las secciones de la sidebar en grupos con titulo; Caja tiene pocas y van juntas, sin titulo. */
export function gruposDelPanel(enlaces: EnlaceDelMarco[]) {
  const pie = enlaces.filter((e) => AL_PIE.includes(e.clave));
  const resto = enlaces.filter((e) => !AL_PIE.includes(e.clave));
  const enOrden = (claves: string[]) =>
    claves.flatMap((clave) => resto.filter((e) => e.clave === clave));
  const agrupados = GRUPOS.map((g) => ({ titulo: g.titulo, enlaces: enOrden(g.claves) }));
  const todosEnGrupo = agrupados.reduce((suma, g) => suma + g.enlaces.length, 0) === resto.length;
  const grupos: GrupoDelPanel[] = todosEnGrupo
    ? agrupados.filter((g) => g.enlaces.length > 0)
    : [{ titulo: null, enlaces: resto }];
  return { grupos: resto.length ? grupos : [], pie };
}
