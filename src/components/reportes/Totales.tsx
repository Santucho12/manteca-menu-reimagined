import { textoDeVariacion, type Variacion } from '@/lib/reportes/comparacion';

/** Sin variacion no se muestra la linea; con null dice que no hay con que comparar. */
export type ItemDeTotal = { etiqueta: string; valor: string; variacion?: Variacion };

// Cuatro numeros: uno por fila en el celular (un monto de 8 cifras no entra en media pantalla),
// de a dos en la tableta y en una fila en la computadora.
const GRILLAS = { tres: 'sm:grid-cols-3', cuatro: 'sm:grid-cols-2 lg:grid-cols-4' };

/** Las tarjetas de numeros de Plan Reminder Pro, sin icono ni movimiento. */
export function Totales({
  items,
  grilla = 'tres',
}: {
  items: ItemDeTotal[];
  grilla?: keyof typeof GRILLAS;
}) {
  return (
    <dl className={`grid grid-cols-1 gap-3 md:gap-4 ${GRILLAS[grilla]}`}>
      {items.map((item) => (
        <div
          key={item.etiqueta}
          className="rounded-xl border border-slate-100 bg-white p-4 md:p-6 space-y-1 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]"
        >
          <dt className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {item.etiqueta}
          </dt>
          <dd className="text-lg md:text-xl font-bold tracking-tight text-slate-900 break-words">
            {item.valor}
          </dd>
          {item.variacion !== undefined ? (
            <dd className="text-xs font-medium text-muted-foreground">
              {textoDeVariacion(item.variacion)}
            </dd>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
