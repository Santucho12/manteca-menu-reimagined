import { Receipt, ShoppingBag, Ticket, TrendingUp } from 'lucide-react';
import { Etiqueta } from '@/components/panel/Piezas';
import type { NumeroDelMes } from '@/lib/inicio/numeros';
import { textoDeVariacion } from '@/lib/reportes/comparacion';

// Excepcion de colores decidida por Santiago (2026-10-20): Inicio lleva verde, rojo y azul.
const TONOS = {
  Ventas: {
    icono: ShoppingBag,
    tarjeta: 'border-green-300 bg-green-100',
    cuadro: 'bg-white text-green-700',
    punto: 'bg-green-600',
  },
  Gastos: {
    icono: Receipt,
    tarjeta: 'border-red-300 bg-red-100',
    cuadro: 'bg-white text-red-700',
    punto: 'bg-red-600',
  },
  Resultado: {
    icono: TrendingUp,
    tarjeta: 'border-blue-300 bg-blue-100',
    cuadro: 'bg-white text-blue-700',
    punto: 'bg-blue-600',
  },
  'Ticket promedio': {
    icono: Ticket,
    tarjeta: 'border-border bg-neutral-100',
    cuadro: 'bg-white text-neutral-700',
    punto: 'bg-neutral-500',
  },
};

export function TarjetasDelMes({ items }: { items: NumeroDelMes[] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const { icono: Icono, tarjeta, cuadro, punto } = TONOS[item.etiqueta as keyof typeof TONOS];
        return (
          <div key={item.etiqueta} className={`rounded-3xl border p-6 ${tarjeta}`}>
            <div className="flex items-start justify-between gap-3">
              <Etiqueta as="dt">{item.etiqueta}</Etiqueta>
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${cuadro}`}>
                <Icono size={20} aria-hidden="true" />
              </span>
            </div>
            <dd className="mt-2 mb-4 text-lg font-bold whitespace-nowrap sm:text-xl lg:text-lg 2xl:text-2xl">
              {item.valor}
            </dd>
            <dd className="text-muted-foreground flex items-center justify-between gap-2 border-t pt-3 text-[11px] font-bold uppercase">
              {textoDeVariacion(item.variacion)}
              <span className={`size-1.5 shrink-0 rounded-full ${punto}`} />
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
