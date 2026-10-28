import { AlertCircle, Ban, CheckCircle2, Clock, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const TONOS = {
  rosa: {
    clases: 'bg-rose-500/10 text-rose-600 border-rose-500/20 animate-pulse-subtle',
    icono: AlertCircle,
  },
  ambar: { clases: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icono: Clock },
  esmeralda: {
    clases: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    icono: CheckCircle2,
  },
  pizarra: { clases: 'bg-slate-500/10 text-slate-500 border-slate-500/20', icono: Ban },
} as const;

export type Tono = keyof typeof TONOS;

type Props = { tono: Tono; icono?: LucideIcon; children: ReactNode };

/** La insignia de estado de Plan Reminder Pro (StatusBadge.tsx). */
export function InsigniaDeEstado({ tono, icono, children }: Props) {
  const { clases, icono: porDefecto } = TONOS[tono];
  const Icono = icono ?? porDefecto;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border transition-all duration-300 shadow-xs',
        clases,
      )}
    >
      <Icono size={12} strokeWidth={2.5} aria-hidden="true" />
      {children}
    </span>
  );
}

const TONOS_DE_CHIP = {
  violeta: 'bg-violet-100 text-violet-700',
  celeste: 'bg-sky-100 text-sky-700',
  ambar: 'bg-amber-100 text-amber-700',
} as const;

/** El chip bajo un nombre (seguimiento, "Automatico", "De caja"): violeta, o el tono que se pida. */
export function Chip({
  children,
  tono = 'violeta',
}: {
  children: ReactNode;
  tono?: keyof typeof TONOS_DE_CHIP;
}) {
  return (
    <span
      className={cn(
        'inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider',
        TONOS_DE_CHIP[tono],
      )}
    >
      {children}
    </span>
  );
}

/** La inicial en un circulo, como el avatar de los clientes de Plan Reminder Pro. */
export function Avatar({ nombre, grande = false }: { nombre: string; grande?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase',
        grande ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs shadow-xs',
      )}
    >
      {nombre.charAt(0)}
    </div>
  );
}
