import { fechaParaMostrar } from '@/lib/gastos/pantalla';

const dosCifras = (numero: number) => String(numero).padStart(2, '0');

// El calendario trabaja con Date; el sistema, con AAAA-MM-DD. Se arma en hora local, para que
// el día que se ve sea el que se guarda.
export function aFecha(texto: string): Date {
  const [anio, mes, dia] = texto.split('-').map(Number) as [number, number, number];
  return new Date(anio, mes - 1, dia);
}

export function aTexto(fecha: Date): string {
  return `${fecha.getFullYear()}-${dosCifras(fecha.getMonth() + 1)}-${dosCifras(fecha.getDate())}`;
}

export const ETIQUETAS_DEL_CALENDARIO = {
  labelDayButton: (fecha: Date) => fechaParaMostrar(aTexto(fecha)),
  labelNext: () => 'Mes siguiente',
  labelPrevious: () => 'Mes anterior',
};

const FLECHA =
  'p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-30';

/** Las piezas del calendario con las clases del panel: el día elegido, en el color principal. */
export const CLASES_DEL_CALENDARIO = {
  root: 'relative text-sm',
  months: 'flex flex-col',
  month: 'space-y-3',
  month_caption: 'flex h-9 items-center justify-center',
  caption_label: 'text-sm font-bold capitalize',
  nav: 'absolute inset-x-0 top-0 flex h-9 items-center justify-between',
  button_previous: FLECHA,
  button_next: FLECHA,
  chevron: 'w-4 h-4 fill-current',
  month_grid: 'border-collapse',
  weekday: 'w-10 h-8 text-[10px] font-bold uppercase tracking-widest text-muted-foreground',
  day: 'p-0.5 text-center',
  day_button:
    'w-9 h-9 rounded-xl text-sm font-semibold hover:bg-primary/10 hover:text-primary transition-colors',
  selected:
    '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground',
  today: '[&>button]:ring-1 [&>button]:ring-primary/40',
  outside: 'opacity-40',
  disabled: 'opacity-30 [&>button]:pointer-events-none',
  hidden: 'invisible',
};
