import type { TipoParaVender } from '@/lib/vender/consultas';
import { cn } from '@/lib/utils';

type Props = { tipos: TipoParaVender[]; elegido: string | null; elegir: (id: string) => void };

/** El tipo de venta: viene Local; para un pedido de PedidosYa o de un mayorista se cambia. */
export function ElegirTipo({ tipos, elegido, elegir }: Props) {
  if (tipos.length < 2) return null;
  return (
    <div role="group" aria-label="Tipo de venta" className="space-y-2">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
        Tipo de venta
      </p>
      <div className="flex flex-wrap gap-2">
        {tipos.map((tipo) => (
          <button
            type="button"
            key={tipo.id}
            aria-pressed={tipo.id === elegido}
            onClick={() => elegir(tipo.id)}
            className={cn(
              'min-h-11 rounded-xl border px-3 text-sm font-bold transition-all active:scale-95',
              tipo.id === elegido
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card hover:border-primary/40',
            )}
          >
            {tipo.nombre}
          </button>
        ))}
      </div>
    </div>
  );
}
