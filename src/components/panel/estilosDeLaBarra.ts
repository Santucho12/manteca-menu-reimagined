// La barra lateral estilo Linear / Modern Minimal, sin azul y con aire vertical (Santiago,
// 2026-11-20, pedido 102). Rehecho a partir de su prueba, después de que otra sesión lo pisara.

export const ENLACE_BASE = 'relative group w-full flex items-center rounded-xl transition-colors';

export const ENLACE_ACTIVO = 'text-foreground font-semibold';

export const ENLACE_INACTIVO = 'text-slate-500 hover:bg-slate-100/70 hover:text-foreground';

/** El fondo de la activa: gris claro con borde, sin azul. */
export const FONDO_ACTIVO = 'absolute inset-0 rounded-xl bg-slate-100 border border-slate-200 z-0';

export const TITULO_DE_GRUPO =
  'px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400';

export const INSIGNIA_LATERAL =
  'relative z-10 ml-auto text-[11px] font-bold text-rose-600 tabular-nums';
