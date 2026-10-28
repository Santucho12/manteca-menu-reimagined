import { fechaCorta } from '@/lib/gastos/filas';
import { cn } from '@/lib/utils';

/** El día y el mes en un cuadradito: ámbar para lo que viene, gris para lo pagado. */
export function BaldosaDeFecha({ fecha, viene = false }: { fecha: string; viene?: boolean }) {
  const { dia, mes } = fechaCorta(fecha);
  return (
    <div
      className={cn(
        'w-11 shrink-0 rounded-xl border py-1.5 text-center',
        viene
          ? 'bg-amber-50 text-amber-700 border-amber-100'
          : 'bg-secondary/60 text-slate-600 border-border',
      )}
    >
      <p className="font-display text-base font-bold leading-none">{dia}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider">{mes}</p>
    </div>
  );
}
