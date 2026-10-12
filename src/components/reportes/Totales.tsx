import { textoDeVariacion, type Variacion } from '@/lib/reportes/comparacion';

/** Sin variacion no se muestra la linea; con null dice que no hay con que comparar. */
export type ItemDeTotal = { etiqueta: string; valor: string; variacion?: Variacion };

// Cuatro numeros: uno por fila en el celular (un monto de 8 cifras no entra en media pantalla),
// de a dos en la tableta y en una fila en la computadora.
const GRILLAS = { tres: 'sm:grid-cols-3', cuatro: 'sm:grid-cols-2 lg:grid-cols-4' };

export function Totales({
  items,
  grilla = 'tres',
}: {
  items: ItemDeTotal[];
  grilla?: keyof typeof GRILLAS;
}) {
  return (
    <dl className={`grid gap-3 ${GRILLAS[grilla]}`}>
      {items.map((item) => (
        <div key={item.etiqueta} className="bg-card rounded-xl border p-4">
          <dt className="text-muted-foreground text-sm">{item.etiqueta}</dt>
          <dd className="text-xl font-semibold">{item.valor}</dd>
          {item.variacion !== undefined ? (
            <dd className="text-muted-foreground text-sm">{textoDeVariacion(item.variacion)}</dd>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
