import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PASOS = ['Productos', 'Tipo de venta', 'Cobro'] as const;

type Props = { paso: number; irA: (paso: number) => void };

/** Los tres pasos de la venta: el actual marcado, los hechos con tilde y se puede volver a uno. */
export function BarraDePasos({ paso, irA }: Props) {
  return (
    <ol aria-label="Pasos de la venta" className="grid grid-cols-3 gap-2">
      {PASOS.map((nombre, i) => {
        const hecho = i < paso;
        const actual = i === paso;
        return (
          <li key={nombre}>
            <button
              type="button"
              disabled={!hecho}
              aria-current={actual ? 'step' : undefined}
              onClick={() => irA(i)}
              className={cn(
                'flex w-full min-h-12 items-center gap-2.5 rounded-2xl px-3 text-left text-sm font-bold transition-all',
                actual && 'bg-foreground text-white shadow-lg shadow-slate-900/20',
                hecho && 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
                !actual && !hecho && 'bg-secondary text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs',
                  actual && 'bg-white text-foreground',
                  hecho && 'bg-emerald-500 text-white',
                  !actual && !hecho && 'bg-white text-muted-foreground',
                )}
              >
                {hecho ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : i + 1}
              </span>
              <span className="truncate">{nombre}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
