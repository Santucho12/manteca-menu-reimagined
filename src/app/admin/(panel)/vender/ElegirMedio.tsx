import { nombreDeMedio } from '@/lib/caja/pantalla';
import { MEDIOS, type Medio } from '@/lib/caja/resultado';
import { cn } from '@/lib/utils';

type Props = {
  grupo: string;
  elegido: Medio | null;
  elegir: (medio: Medio) => void;
  /** Un medio que no se ofrece: el segundo no puede ser el primero. */
  sin?: Medio | null;
};

/** Los medios de pago como botones grandes: se toca uno. */
export function ElegirMedio({ grupo, elegido, elegir, sin = null }: Props) {
  return (
    <div role="group" aria-label={grupo} className="space-y-2">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
        {grupo}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
        {MEDIOS.filter((medio) => medio !== sin).map((medio) => (
          <button
            type="button"
            key={medio}
            aria-pressed={medio === elegido}
            onClick={() => elegir(medio)}
            className={cn(
              'min-h-12 rounded-xl border px-3 text-sm font-bold transition-all active:scale-95',
              medio === elegido
                ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'border-border bg-card hover:border-primary/40',
            )}
          >
            {nombreDeMedio(medio)}
          </button>
        ))}
      </div>
    </div>
  );
}
