import { Receipt, ShoppingBag, Ticket, TrendingUp } from 'lucide-react';
import { Etiqueta } from '@/components/panel/Piezas';
import type { NumeroDelMes } from '@/lib/inicio/numeros';

// Un color por dato, como en un tablero: indigo, coral, menta y ambar.
const TONOS = {
  Ventas: { icono: ShoppingBag, cuadro: 'bg-indigo-50 text-indigo-600', barra: 'bg-indigo-500' },
  Gastos: { icono: Receipt, cuadro: 'bg-rose-50 text-rose-600', barra: 'bg-rose-500' },
  Balance: { icono: TrendingUp, cuadro: 'bg-emerald-50 text-emerald-600', barra: 'bg-emerald-500' },
  'Ticket promedio': { icono: Ticket, cuadro: 'bg-amber-50 text-amber-600', barra: 'bg-amber-500' },
};

export function TarjetasDelMes({ items }: { items: NumeroDelMes[] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const { icono: Icono, cuadro, barra } = TONOS[item.etiqueta as keyof typeof TONOS];
        return (
          <div
            key={item.etiqueta}
            className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm"
          >
            <span className={`absolute inset-x-6 top-0 h-1 rounded-b-full ${barra}`} />
            <div className="flex items-center justify-between gap-3">
              <Etiqueta as="dt">{item.etiqueta}</Etiqueta>
              <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${cuadro}`}>
                <Icono size={20} aria-hidden="true" />
              </span>
            </div>
            <dd className="font-heading mt-4 text-xl font-bold tracking-tight whitespace-nowrap xl:text-2xl">
              {item.valor}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
