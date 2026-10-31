import { fechaCorta } from '@/lib/gastos/filas';
import { cn } from '@/lib/utils';

const TONOS = {
  paso: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  viene: 'bg-rose-50 text-rose-600 border-rose-100',
  vencido: 'bg-rose-100 text-rose-700 border-rose-300',
};

/** El día y el mes en un cuadradito: rojo lo que falta pagar (más fuerte si ya venció), verde lo pagado. */
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
        'shrink-0 rounded-2xl border text-center',
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
