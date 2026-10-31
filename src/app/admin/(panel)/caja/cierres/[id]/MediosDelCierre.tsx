import type { ResultadoDeMedio } from '@/lib/caja/resultado';
import { nombreDeMedio, textoDeDiferencia } from '@/lib/caja/pantalla';
import { formatearPesos } from '@/lib/plata';
import { cn } from '@/lib/utils';

function Tarjeta({ medio }: { medio: ResultadoDeMedio }) {
  const cierra = medio.diferenciaCentavos === 0;
  return (
    <li className="rounded-2xl border border-border/60 bg-secondary/30 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold">{nombreDeMedio(medio.medio)}</span>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-[11px] font-bold',
            cierra ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
          )}
        >
          {textoDeDiferencia(medio.diferenciaCentavos)}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        <div>
          <dt className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Declarado
          </dt>
          <dd className="font-display text-lg font-bold">
            {formatearPesos(medio.declaradoCentavos)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Esperado
          </dt>
          <dd className="font-display text-lg font-bold text-muted-foreground">
            {formatearPesos(medio.esperadoCentavos)}
          </dd>
        </div>
      </dl>
    </li>
  );
}

/** Una tarjeta por medio de pago: lo que se declaró, lo que se esperaba y si cierra. */
export function MediosDelCierre({ medios }: { medios: ResultadoDeMedio[] }) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {medios.map((medio) => (
        <Tarjeta key={medio.medio} medio={medio} />
      ))}
    </ul>
  );
}
