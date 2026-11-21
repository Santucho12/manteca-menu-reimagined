import { ArrowLeft, ArrowRight } from 'lucide-react';
import { formatearPesos } from '@/lib/plata';
import { cn } from '@/lib/utils';

type Props = { paso: number; totalCentavos: number; vacio: boolean; irA: (paso: number) => void };

/** Abajo, siempre a mano: el total, volver y seguir. En el último paso se cobra desde el cobro. */
export function PieDelPaso({ paso, totalCentavos, vacio, irA }: Props) {
  return (
    <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-3xl border border-border bg-white/95 p-3 pl-5 shadow-[0_10px_40px_-12px_rgba(15,23,42,0.35)] backdrop-blur">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Total
        </p>
        <p className="font-display text-2xl font-extrabold tabular-nums">
          {formatearPesos(totalCentavos)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {paso > 0 ? (
          <button
            type="button"
            onClick={() => irA(paso - 1)}
            className="flex min-h-14 items-center gap-2 rounded-2xl px-4 text-sm font-bold text-muted-foreground hover:bg-secondary"
          >
            <ArrowLeft size={18} aria-hidden="true" /> Atrás
          </button>
        ) : null}
        {paso < 2 ? (
          <button
            type="button"
            disabled={vacio}
            onClick={() => irA(paso + 1)}
            className={cn(
              'flex min-h-14 items-center gap-2 rounded-2xl bg-foreground px-6 text-base font-bold text-white transition-all active:scale-[0.98]',
              vacio && 'opacity-40',
            )}
          >
            Siguiente <ArrowRight size={18} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
