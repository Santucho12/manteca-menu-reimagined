import Link from 'next/link';
import { enlaceDeGastos, type FiltrosDeGastos } from '@/lib/gastos/pantalla';
import { OPCIONES_DE_ADELANTO } from '@/lib/gastos/porPagar';
import { cn } from '@/lib/utils';

type Props = { filtros: FiltrosDeGastos; hoy: string; elegido: string };

const enlace = (filtros: FiltrosDeGastos, hoy: string, valor: string) => {
  const base = enlaceDeGastos(filtros, hoy);
  return `${base}${base.includes('?') ? '&' : '?'}proximos=${valor}`;
};

/** Hasta cuando se miran los proximos pagos: 15 dias, 30 (lo de siempre), un año o todos. */
export function HorizonteDePagos({ filtros, hoy, elegido }: Props) {
  return (
    <nav
      aria-label="Hasta cuándo ver los próximos pagos"
      className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 md:px-5 py-2.5"
    >
      <span className="mr-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        Ver
      </span>
      {OPCIONES_DE_ADELANTO.map((opcion) => (
        <Link
          key={opcion.valor}
          href={enlace(filtros, hoy, opcion.valor)}
          aria-current={elegido === opcion.valor ? 'true' : undefined}
          className={cn(
            'rounded-lg px-2.5 py-1 text-xs font-bold transition-all',
            elegido === opcion.valor
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
          )}
        >
          {opcion.texto}
        </Link>
      ))}
    </nav>
  );
}
