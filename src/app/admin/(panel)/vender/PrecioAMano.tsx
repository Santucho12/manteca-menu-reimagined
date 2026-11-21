'use client';

import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { formatearPesos } from '@/lib/plata';
import type { RenglonDelTicket } from '@/lib/vender/ticket';

type Props = { renglon: RenglonDelTicket; cambiar: (centavos: number | undefined) => void };

/** Cambiar el precio de un producto en esta venta: una promo, Pedidos Ya (pedido 102). */
export function PrecioAMano({ renglon, cambiar }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [escrito, setEscrito] = useState('');
  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <Pencil size={12} aria-hidden="true" />
        {renglon.precioEspecial
          ? `Precio a mano: ${formatearPesos(renglon.precioEspecial)} (menú ${formatearPesos(renglon.precioCentavos)})`
          : 'Cambiar precio'}
      </button>
    );
  }
  const pesos = Number(escrito.replace(/\./g, ''));
  const guardar = () => {
    cambiar(Number.isInteger(pesos) && pesos > 0 ? pesos * 100 : undefined);
    setAbierto(false);
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        aria-label={`Precio a mano de ${renglon.nombre}`}
        inputMode="numeric"
        autoFocus
        placeholder={`Menú: ${formatearPesos(renglon.precioCentavos)}`}
        value={escrito}
        onChange={(e) => setEscrito(e.target.value)}
        className="h-10 w-36 rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:border-foreground"
      />
      <button
        type="button"
        onClick={guardar}
        className="h-10 rounded-xl bg-foreground px-3 text-xs font-bold text-white"
      >
        Usar
      </button>
      {renglon.precioEspecial ? (
        <button
          type="button"
          onClick={() => {
            cambiar(undefined);
            setAbierto(false);
          }}
          className="h-10 rounded-xl px-3 text-xs font-bold text-muted-foreground hover:bg-secondary"
        >
          Volver al del menú
        </button>
      ) : null}
    </div>
  );
}
