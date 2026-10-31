import { AlertTriangle, CheckCircle2, Ban, type LucideIcon } from 'lucide-react';
import type { Cierre } from '@/lib/caja/consultas';
import { nombreDeEstado } from '@/lib/caja/pantalla';
import { titularDelCierre } from '@/lib/caja/titular';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { diaDeLaSemana } from '@/lib/caja/diaDeLaSemana';
import { cn } from '@/lib/utils';

type Aspecto = { icono: LucideIcon; fondo: string; color: string };

function aspectoDe(cierre: Cierre): Aspecto {
  if (cierre.anulado) return { icono: Ban, fondo: 'bg-slate-100', color: 'text-slate-500' };
  if (cierre.estado === 'cierra') {
    return { icono: CheckCircle2, fondo: 'bg-emerald-50', color: 'text-emerald-600' };
  }
  return { icono: AlertTriangle, fondo: 'bg-rose-50', color: 'text-rose-600' };
}

/** Lo primero de la ficha: si la caja cerró, en grande, con el día y quién la cargó. */
export function ResumenDelCierre({ cierre }: { cierre: Cierre }) {
  const { icono: Icono, fondo, color } = aspectoDe(cierre);
  const titular = titularDelCierre(cierre, cierre.diferenciaTotalCentavos);
  return (
    <div className="bg-card rounded-[2rem] border border-border/60 shadow-xl p-5 md:p-8 flex items-center gap-4 md:gap-6">
      <div
        className={cn(
          'size-14 md:size-16 shrink-0 rounded-2xl flex items-center justify-center',
          fondo,
        )}
      >
        <Icono className={color} size={28} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          {diaDeLaSemana(cierre.fecha)} {fechaParaMostrar(cierre.fecha)} ·{' '}
          <span>{cierre.anulado ? 'Anulado' : nombreDeEstado(cierre.estado)}</span>
        </p>
        <p className={cn('font-display text-2xl md:text-3xl font-bold tracking-tight', color)}>
          {titular}
        </p>
        <p className="text-sm text-muted-foreground">Cargado por {cierre.persona}</p>
      </div>
    </div>
  );
}
