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

// El efecto de Apple: la tarjeta se levanta y crece un poco, con un movimiento que arranca rapido y
// se frena suave, y una sombra ancha y difusa. Con "reducir movimiento" no se mueve.
const TARJETA =
  'group relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-[0_26px_46px_-22px_rgba(42,26,16,0.42)] motion-safe:hover:[transform:translateY(-6px)_scale(1.03)]';
const ICONO =
  'grid size-11 shrink-0 place-items-center rounded-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover:[transform:scale(1.12)_rotate(-6deg)]';

export function TarjetasDelMes({ items }: { items: NumeroDelMes[] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const { icono: Icono, cuadro, barra } = TONOS[item.etiqueta as keyof typeof TONOS];
        return (
          <div key={item.etiqueta} className={TARJETA}>
            <span className={`absolute inset-x-6 top-0 h-1 rounded-b-full ${barra}`} />
            <div className="flex items-center justify-between gap-3">
              <Etiqueta as="dt">{item.etiqueta}</Etiqueta>
              <span className={`${ICONO} ${cuadro}`}>
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
