import {
  BarChart3,
  Ban,
  Hash,
  Receipt,
  ShoppingBag,
  Ticket,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { colorDeTarjeta } from '@/lib/inicio/coloresDeTarjetas';
import { textoDeVariacion, type Variacion } from '@/lib/reportes/comparacion';

/** Sin variacion no se muestra la linea; con null dice que no hay con que comparar. */
export type ItemDeTotal = { etiqueta: string; valor: string; variacion?: Variacion };

// Cuatro numeros: uno por fila en el celular (un monto de 8 cifras no entra en media pantalla),
// de a dos en la tableta y en una fila en la computadora.
const GRILLAS = { tres: 'sm:grid-cols-3', cuatro: 'sm:grid-cols-2 lg:grid-cols-4' };

const ICONOS: Record<string, LucideIcon> = {
  Ventas: ShoppingBag,
  Cobrado: Wallet,
  Gastos: Receipt,
  Costo: Receipt,
  Balance: TrendingUp,
  Ganancia: TrendingUp,
  'Ticket promedio': Ticket,
  'Cantidad de ventas': Hash,
  Anuladas: Ban,
};

/**
 * Las tarjetas de numeros de Inicio y Ventas (skill estetica-sistema): el borde, el ícono y el
 * punto del color de lo que muestran, el monto en Outfit y la variacion al pie.
 */
export function Totales({
  items,
  grilla = 'tres',
}: {
  items: ItemDeTotal[];
  grilla?: keyof typeof GRILLAS;
}) {
  return (
    <dl className={`grid grid-cols-1 gap-3 md:gap-4 ${GRILLAS[grilla]}`}>
      {items.map((item) => {
        const { borde, icono, punto } = colorDeTarjeta(item.etiqueta);
        const Icono = ICONOS[item.etiqueta] ?? BarChart3;
        return (
          <div
            key={item.etiqueta}
            className={`flex flex-col rounded-xl border ${borde} bg-white p-4 md:p-6 shadow-card transition-all duration-300`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 space-y-1">
                <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {item.etiqueta}
                </dt>
                <dd className="font-display text-xl font-bold tracking-tight break-words text-slate-900 sm:text-2xl 2xl:text-3xl">
                  {item.valor}
                </dd>
              </div>
              <div className={`shrink-0 rounded-lg border p-1.5 md:p-2 ${icono} ${borde}`}>
                <Icono size={18} aria-hidden="true" />
              </div>
            </div>
            <dd className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] font-bold text-muted-foreground md:pt-4">
              {item.variacion !== undefined ? textoDeVariacion(item.variacion) : null}
              <span
                aria-hidden="true"
                className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${punto}`}
              />
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
