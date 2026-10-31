// Las clases de Plan Reminder Pro que se repiten en el panel (skill estetica-panel, piezas.md).

export const ETIQUETA = 'text-[10px] font-black text-muted-foreground uppercase tracking-widest';

export const CAMPO =
  'w-full h-12 rounded-xl bg-secondary/30 border-none px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/20 transition-all';

export const BOTON_PRINCIPAL =
  'h-12 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-xl hover:shadow-primary/30 active:translate-y-0 active:scale-95 transition-all duration-200 flex items-center gap-2 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-lg';

export const BOTON_PRINCIPAL_AL_PIE =
  'flex-[2] h-12 rounded-xl bg-primary text-primary-foreground font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-xl hover:shadow-primary/30 active:translate-y-0 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2';

export const BOTON_CANCELAR =
  'flex-1 h-12 rounded-xl bg-secondary text-foreground font-bold text-[10px] uppercase tracking-widest border border-transparent hover:border-border hover:bg-white hover:shadow-md active:scale-95 transition-all duration-200 flex items-center justify-center';

// Los botones de arriba de cada pantalla, simples: sin mayúsculas, sin sombra y sin saltito
// (Santiago, 2026-10-27). El ícono va a 16 aunque la pantalla lo pida más grande.
export const BOTON_DE_ENCABEZADO =
  'flex-1 lg:flex-none h-10 pointer-coarse:h-11 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold whitespace-nowrap hover:brightness-105 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 [&_svg]:size-4';

export const BOTON_DE_ENCABEZADO_SECUNDARIO =
  'flex-1 lg:flex-none h-10 px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold whitespace-nowrap hover:brightness-105 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 [&_svg]:size-4';

export const BOTON_ESMERALDA =
  'h-12 px-6 rounded-xl bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-xl hover:shadow-emerald-600/30 active:translate-y-0 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60';

export const BOTON_SUAVE =
  'h-12 px-6 rounded-xl bg-secondary text-foreground font-bold text-[10px] uppercase tracking-widest border border-transparent hover:border-border hover:bg-white hover:shadow-md active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60';

export const BOTON_PELIGRO =
  'h-10 pointer-coarse:h-11 px-4 rounded-xl border border-rose-200 text-rose-700 font-bold text-[10px] uppercase tracking-widest hover:bg-rose-50 hover:border-rose-300 hover:shadow-md hover:shadow-rose-200/60 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50';

export const BOTON_REACTIVAR =
  'h-10 px-4 rounded-xl border border-emerald-200 text-emerald-700 font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-200/60 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50';

export const BOTON_DE_FILA =
  'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider whitespace-nowrap bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-xl hover:shadow-primary/30 active:translate-y-0 active:scale-95 transition-all duration-200';

export const BOTON_DE_FILA_SUAVE =
  'inline-flex items-center gap-1.5 h-8 pointer-coarse:h-11 px-2.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-bold hover:bg-emerald-100 hover:border-emerald-300 active:scale-95 transition-all whitespace-nowrap';

export const ICONO_EDITAR =
  'p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 hover:scale-110 active:scale-95 transition-all duration-200';

export const ICONO_BORRAR =
  'p-1.5 pointer-coarse:p-3.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:scale-110 active:scale-95 transition-all duration-200';

export const ATAJO =
  'inline-flex items-center gap-1 h-9 pointer-coarse:h-11 px-3 rounded-xl text-xs font-bold bg-secondary/60 text-slate-600 hover:bg-primary/10 hover:text-primary hover:-translate-y-0.5 hover:shadow-sm active:scale-95 transition-all duration-200 whitespace-nowrap';

export const TARJETA_DE_SECCION =
  'bg-card rounded-[2rem] border border-border/60 shadow-xl p-5 md:p-8 space-y-6';

export const TARJETA_DE_FORMULARIO =
  'bg-card rounded-[2rem] border border-border/50 shadow-xl p-5 md:p-8 space-y-5';

export const ICONO_DE_TARJETA =
  'w-12 h-12 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20';

export const MOSAICO = 'rounded-xl bg-secondary/40 p-3';

export const CERRAR_VENTANA = 'p-2 rounded-full hover:bg-secondary transition-colors';

export const LUGAR_DE_ABAJO =
  'flex-1 min-w-0 h-16 flex flex-col items-center justify-center gap-1 text-[9px] font-bold transition-colors';

export const TITULO_DE_COLUMNA =
  'py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest';

export const CANTIDAD_DE_RESULTADOS =
  'text-xs font-semibold tracking-widest text-muted-foreground uppercase';

export const FALTA_EL_DATO = 'text-xs text-muted-foreground/70 italic';

export const CAMPO_DE_FILTRO =
  'w-full min-w-0 sm:w-[180px] h-11 md:h-14 px-3 md:px-4 rounded-xl md:rounded-2xl bg-secondary/30 border-none text-xs md:text-sm font-semibold focus:ring-2 focus:ring-primary/20';

// Fechas y desplegables: en la tablet van de a dos por renglon; desde xl, todos en uno.
export const BARRA_AUTOMATICA =
  'grid grid-cols-1 sm:grid-cols-2 sm:items-end xl:flex xl:flex-row xl:flex-wrap gap-3 md:gap-4 mb-6 md:mb-8 bg-card border border-border p-3 md:p-5 rounded-2xl md:rounded-3xl shadow-xs';

export const BARRA_DE_FILTROS =
  'flex flex-col xl:flex-row xl:flex-wrap xl:items-end gap-3 md:gap-4 mb-6 md:mb-8 bg-card border border-border p-3 md:p-5 rounded-2xl md:rounded-3xl shadow-xs';

export const BOTON_DE_ENCABEZADO_NEUTRO =
  'flex-1 lg:flex-none h-10 pointer-coarse:h-11 px-4 rounded-xl border border-border bg-card text-foreground text-sm font-semibold whitespace-nowrap hover:bg-secondary active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 [&_svg]:size-4';

/** Un icono de accion de una fila que no edita ni borra (subir, bajar, mostrar). */
export const ICONO_DE_ACCION =
  'p-1.5 pointer-coarse:p-3.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-all duration-200 disabled:opacity-40';

/** El botón de las tarjetas de Inicio (Ver reportes, Ver gastos, Ver todo el año): una sola pieza. */
export const BOTON_DE_TARJETA =
  'group inline-flex h-10 pointer-coarse:h-11 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full border border-border bg-white pl-4 pr-1.5 text-xs font-bold text-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#d8cdb6] hover:shadow-xl active:translate-y-0';

/** Los accesos de arriba de Ventas: la acción principal dorada y las demás en píldora blanca con su icono en círculo. */
export const ACCESO_PRINCIPAL =
  'group flex-1 lg:flex-none inline-flex h-11 items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-primary pl-3 pr-5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg active:translate-y-0 active:scale-[0.98]';

export const ACCESO_SECUNDARIO =
  'group flex-1 lg:flex-none inline-flex h-11 items-center justify-center gap-2.5 whitespace-nowrap rounded-full border border-border bg-white pl-3 pr-5 text-sm font-semibold text-foreground shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#d8cdb6] hover:shadow-lg active:translate-y-0 active:scale-[0.98]';

/** El acceso que confirma plata o importa (el Excel de Fudo): verde, como el resto del panel. */
export const ACCESO_VERDE =
  'group flex-1 lg:flex-none inline-flex h-11 items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-emerald-600 pl-3 pr-5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg active:translate-y-0 active:scale-[0.98]';

export const ICONO_DE_ACCESO_SOBRE_VERDE =
  'flex h-7 w-7 items-center justify-center rounded-full bg-white/20 transition-transform duration-200 group-hover:scale-110';

export const ACCESO_DE_PELIGRO =
  'group inline-flex h-11 items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-rose-600 pl-3 pr-5 text-sm font-bold text-white shadow-md shadow-rose-600/25 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg active:translate-y-0 active:scale-[0.98] disabled:opacity-50';

export const ICONO_DE_ACCESO_PELIGRO =
  'flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white transition-transform duration-200 group-hover:scale-110';

export const ICONO_DE_ACCESO =
  'flex h-7 w-7 items-center justify-center rounded-full bg-black/10 transition-transform duration-200 group-hover:scale-110';

export const ICONO_DE_ACCESO_SUAVE =
  'flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-all duration-200 group-hover:scale-110 group-hover:bg-[#e6dcc8] group-hover:text-foreground';

export const CIRCULO_DE_BOTON =
  'flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-all duration-200 group-hover:scale-110 group-hover:bg-[#e6dcc8] group-hover:text-foreground';

export const FLECHA_DE_BOTON =
  'transition-transform duration-200 group-hover:translate-x-px group-hover:-translate-y-px';
