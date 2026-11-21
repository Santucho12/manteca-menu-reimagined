import { Store } from 'lucide-react';
import { tonoDelTipo } from '@/lib/vender/colores';
import type { TipoParaVender } from '@/lib/vender/consultas';
import { cn } from '@/lib/utils';

type Props = { tipos: TipoParaVender[]; elegido: string | null; elegir: (id: string) => void };

/** Dónde se vendió: una tarjeta grande de color por tipo, en el orden de Tipos de venta. */
export function ElegirTipo({ tipos, elegido, elegir }: Props) {
  return (
    <div role="group" aria-label="Tipo de venta" className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {tipos.map((tipo, i) => {
        const tono = tonoDelTipo(tipo.nombre, i);
        const actual = tipo.id === elegido;
        return (
          <button
            type="button"
            key={tipo.id}
            aria-pressed={actual}
            onClick={() => elegir(tipo.id)}
            className={cn(
              'flex min-h-28 flex-col items-start justify-between gap-3 rounded-3xl border-2 p-4 text-left text-base font-bold transition-all active:scale-[0.98]',
              tono.suave,
              tono.texto,
              actual
                ? 'border-foreground shadow-lg ring-4 ring-foreground/10'
                : 'border-transparent',
            )}
          >
            <span
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-2xl text-white',
                tono.solido,
              )}
            >
              <Store size={20} aria-hidden="true" />
            </span>
            {tipo.nombre}
          </button>
        );
      })}
    </div>
  );
}
