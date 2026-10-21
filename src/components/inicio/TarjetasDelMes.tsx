import { Receipt, ShoppingBag, Ticket, TrendingUp } from 'lucide-react';
import { Etiqueta } from '@/components/panel/Piezas';
import type { NumeroDelMes } from '@/lib/inicio/numeros';

// Un icono por dato; el color es el de la marca en todas (skill estetica-panel).
const CUADRO = 'bg-accent/15 text-foreground';
const BARRA = 'bg-accent';
const TONOS = {
  Ventas: { icono: ShoppingBag, cuadro: CUADRO, barra: BARRA },
  Gastos: { icono: Receipt, cuadro: CUADRO, barra: BARRA },
  Balance: { icono: TrendingUp, cuadro: CUADRO, barra: BARRA },
  'Ticket promedio': { icono: Ticket, cuadro: CUADRO, barra: BARRA },
};

export function TarjetasDelMes({ items }: { items: NumeroDelMes[] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const { icono: Icono, cuadro, barra } = TONOS[item.etiqueta as keyof typeof TONOS];
        return (
          <div
            key={item.etiqueta}
            className="relative overflow-hidden rounded-3xl border bg-card border p-6 shadow-sm"
          >
            <span className={`absolute inset-x-6 top-0 h-1 rounded-b-full ${barra}`} />
            <div className="flex items-center justify-between gap-3">
              <Etiqueta as="dt">{item.etiqueta}</Etiqueta>
              <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${cuadro}`}>
                <Icono size={20} aria-hidden="true" />
              </span>
            </div>
            <dd className="font-heading mt-4 text-lg font-bold tracking-tight break-words xl:text-xl">
              {item.valor}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
