import { fechaCorta } from '@/lib/gastos/filas';
import { cn } from '@/lib/utils';

const TONOS = {
  paso: 'bg-secondary/60 text-slate-600 border-border',
  viene: 'bg-amber-50 text-amber-700 border-amber-100',
  vencido: 'bg-rose-50 text-rose-700 border-rose-100',
};

/** El día y el mes en un cuadradito: ámbar lo que viene, rosa lo vencido, gris lo pagado. */
export function BaldosaDeFecha({
  fecha,
  viene = false,
  vencido = false,
}: {
  fecha: string;
  viene?: boolean;
  vencido?: boolean;
}) {
  const { dia, mes } = fechaCorta(fecha);
  const tono = vencido ? 'vencido' : viene ? 'viene' : 'paso';
  return (
    <div className={cn('w-11 shrink-0 rounded-xl border py-1.5 text-center', TONOS[tono])}>
      <p className="font-display text-base font-bold leading-none">{dia}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider">{mes}</p>
    </div>
  );
}
