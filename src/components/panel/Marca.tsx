import { Croissant } from 'lucide-react';
import { cn } from '@/lib/utils';

// La pieza de marca de Plan Reminder Pro con el nombre de Manteca (decision de Santiago,
// 2026-10-21). La medialuna va con trazo: rellena queda como una mancha.
const TAMANOS = {
  lateral: {
    caja: 'flex items-center gap-3',
    cuadrado: 'w-9 h-9 rounded-xl shadow-lg shadow-primary/30',
    icono: 22,
    nombre: 'text-xl',
    lema: 'text-[7px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap mt-1',
  },
  barra: {
    caja: 'flex items-center gap-2',
    cuadrado: 'w-8 h-8 rounded-lg',
    icono: 18,
    nombre: 'text-lg',
    lema: null,
  },
  ingreso: {
    caja: 'flex flex-col items-center text-center',
    cuadrado: 'w-16 h-16 rounded-2xl shadow-xl shadow-primary/20 mb-4 rotate-3',
    icono: 32,
    nombre: 'text-4xl text-slate-900',
    lema: 'text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3',
  },
} as const;

/** El cuadrado verde con la medialuna, "Manteca" y el lema. Para el lector es una sola imagen. */
export function Marca({ tamano }: { tamano: keyof typeof TAMANOS }) {
  const { caja, cuadrado, icono, nombre, lema } = TAMANOS[tamano];
  return (
    <div role="img" aria-label="Manteca" className={caja}>
      <div className={cn('bg-primary flex items-center justify-center', cuadrado)}>
        <Croissant className="text-primary-foreground" size={icono} strokeWidth={2.5} />
      </div>
      <div>
        <p className={cn('font-display font-extrabold tracking-tight leading-none', nombre)}>
          Manteca
        </p>
        {lema ? <p className={lema}>Sistema de gestión</p> : null}
      </div>
    </div>
  );
}
