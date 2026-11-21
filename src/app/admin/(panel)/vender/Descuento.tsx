'use client';

import { BadgePercent } from 'lucide-react';
import { formatearPesos } from '@/lib/plata';
import { cn } from '@/lib/utils';
import type { DescuentoEscrito } from '@/lib/vender/descuento';

type Props = {
  abierto: boolean;
  alternar: () => void;
  escrito: DescuentoEscrito;
  cambiar: (cambios: Partial<DescuentoEscrito>) => void;
  /** Lo que se descuenta con lo escrito, en centavos; 0 si todavía no vale. */
  descuentoCentavos: number;
};

// Total final (pedido 102): se escribe lo que se cobra y se descuenta la diferencia.
const NOMBRES = { porcentaje: 'Porcentaje (%)', monto: 'Monto ($)', total: 'Total final ($)' };
const AYUDA = { porcentaje: 'Ej: 10', monto: 'Ej: 1.500', total: 'Ej: 18.000' };

const CAMPO =
  'h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:border-foreground';

/** El botón de descuento y, abierto, porcentaje o monto, el valor y el motivo (pedido 102). */
export function Descuento({ abierto, alternar, escrito, cambiar, descuentoCentavos }: Props) {
  return (
    <>
      <button
        type="button"
        aria-pressed={abierto}
        onClick={alternar}
        className={cn(
          'flex h-9 pointer-coarse:h-11 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-colors',
          abierto
            ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
            : 'bg-secondary text-foreground hover:bg-secondary/80',
        )}
      >
        <BadgePercent size={14} aria-hidden="true" /> Hacer un descuento
      </button>
      {abierto ? (
        <div className="basis-full space-y-3 rounded-2xl border border-rose-200 bg-rose-50/50 p-4">
          <div role="group" aria-label="Tipo de descuento" className="flex gap-2">
            {(['porcentaje', 'monto', 'total'] as const).map((tipo) => (
              <button
                key={tipo}
                type="button"
                aria-pressed={escrito.tipo === tipo}
                onClick={() => cambiar({ tipo })}
                className={cn(
                  'h-10 rounded-xl px-4 text-sm font-bold',
                  escrito.tipo === tipo
                    ? 'bg-rose-600 text-white'
                    : 'bg-white text-rose-800 ring-1 ring-rose-200',
                )}
              >
                {NOMBRES[tipo]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              aria-label={
                escrito.tipo === 'total'
                  ? 'Total final'
                  : escrito.tipo === 'porcentaje'
                    ? 'Porcentaje de descuento'
                    : 'Monto del descuento'
              }
              inputMode="numeric"
              placeholder={AYUDA[escrito.tipo]}
              value={escrito.valor}
              onChange={(e) => cambiar({ valor: e.target.value })}
              className={cn(CAMPO, 'w-32')}
            />
            {descuentoCentavos > 0 ? (
              <span className="text-sm font-bold text-rose-700 tabular-nums">
                − {formatearPesos(descuentoCentavos)}
              </span>
            ) : null}
          </div>
          <input
            aria-label="Motivo del descuento"
            placeholder="Motivo del descuento (ej: cliente de siempre)"
            maxLength={300}
            value={escrito.motivo}
            onChange={(e) => cambiar({ motivo: e.target.value })}
            className={cn(CAMPO, 'w-full')}
          />
        </div>
      ) : null}
    </>
  );
}
