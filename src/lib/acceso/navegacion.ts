type ConDestino = { clave: string; href: string };

/** Lo que va abajo en el celular cuando no entran todos: lo que se usa cada dia. */
export const ABAJO_EN_EL_CELULAR = ['inicio', 'ventas', 'gastos', 'caja'];
// Plan Reminder Pro tiene 5 secciones: con 5 o menos, entran todas en la barra de abajo.
const ENTRAN_ABAJO = 5;

const dentroDe = (ruta: string, base: string) => ruta === base || ruta.startsWith(`${base}/`);
// La seccion de un enlace: /admin/caja/control es de /admin/caja. Inicio (/admin) es solo /admin.
const seccionDe = (href: string) => href.split('/').slice(0, 3).join('/');

function masLargo(enlaces: ConDestino[]): string | null {
  const ordenados = [...enlaces].sort((a, b) => b.href.length - a.href.length);
  return ordenados[0]?.clave ?? null;
}

/** El enlace de la pantalla en la que se esta: primero el que coincide entero, si no su seccion. */
export function enlaceActivo(enlaces: ConDestino[], ruta: string): string | null {
  const sinInicio = enlaces.filter((e) => e.href !== '/admin');
  const exacto = masLargo(sinInicio.filter((e) => dentroDe(ruta, e.href)));
  if (exacto) return exacto;
  const seccion = masLargo(sinInicio.filter((e) => dentroDe(ruta, seccionDe(e.href))));
  if (seccion) return seccion;
  return enlaces.find((e) => e.href === '/admin' && ruta === '/admin')?.clave ?? null;
}

export function repartirParaCelular<T extends { clave: string }>(enlaces: T[]) {
  if (enlaces.length <= ENTRAN_ABAJO) return { abajo: enlaces, mas: [] as T[] };
  return {
    abajo: enlaces.filter((e) => ABAJO_EN_EL_CELULAR.includes(e.clave)),
    mas: enlaces.filter((e) => !ABAJO_EN_EL_CELULAR.includes(e.clave)),
  };
}

/** Lo que avisan los enlaces que quedaron en "Mas": se ve sobre el boton aunque este cerrado. */
export function insigniaDeMas(mas: { insignia: number | null }[]): number | null {
  const total = mas.reduce((suma, enlace) => suma + (enlace.insignia ?? 0), 0);
  return total > 0 ? total : null;
}
