import { Receipt, ShoppingBag, Ticket, TrendingUp } from 'lucide-react';
import { Etiqueta } from '@/components/panel/Piezas';
import type { NumeroDelMes } from '@/lib/inicio/numeros';

// Excepcion de colores decidida por Santiago (2026-10-20): Inicio lleva verde, rojo y azul.
const TONOS = {
  Ventas: {
    icono: ShoppingBag,
    tarjeta: 'border-emerald-100 bg-white',
    cuadro: 'border border-emerald-100 bg-emerald-50 text-emerald-600',
  },
  Gastos: {
    icono: Receipt,
    tarjeta: 'border-rose-100 bg-white',
    cuadro: 'border border-rose-100 bg-rose-50 text-rose-600',
  },
  Balance: {
    icono: TrendingUp,
    tarjeta: 'border-blue-100 bg-white',
    cuadro: 'border border-blue-100 bg-blue-50 text-blue-600',
  },
  'Ticket promedio': {
    icono: Ticket,
    tarjeta: 'border-slate-100 bg-white',
    cuadro: 'border border-slate-100 bg-slate-50 text-slate-600',
  },
};

export function TarjetasDelMes({ items }: { items: NumeroDelMes[] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const { icono: Icono, tarjeta, cuadro } = TONOS[item.etiqueta as keyof typeof TONOS];
        return (
          <div
            key={item.etiqueta}
            className={`rounded-xl border p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] ${tarjeta}`}
          >
            <div className="flex items-start justify-between gap-3">
              <Etiqueta as="dt">{item.etiqueta}</Etiqueta>
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${cuadro}`}>
                <Icono size={20} aria-hidden="true" />
              </span>
            </div>
            <dd className="font-heading mt-3 text-lg font-bold whitespace-nowrap sm:text-xl lg:text-lg 2xl:text-2xl">
              {item.valor}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
