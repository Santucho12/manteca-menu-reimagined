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
  chica = false,
}: {
  fecha: string;
  viene?: boolean;
  vencido?: boolean;
  chica?: boolean;
}) {
  const { dia, mes } = fechaCorta(fecha);
  const tono = vencido ? 'vencido' : viene ? 'viene' : 'paso';
  return (
    <div
      className={cn(
        'shrink-0 rounded-xl border text-center',
        chica ? 'w-9 py-1' : 'w-11 py-1.5',
        TONOS[tono],
      )}
    >
      <p className={cn('font-display font-bold leading-none', chica ? 'text-sm' : 'text-base')}>
        {dia}
      </p>
      <p className={cn('font-bold uppercase tracking-wider', chica ? 'text-[9px]' : 'text-[10px]')}>
        {mes}
      </p>
    </div>
  );
}
