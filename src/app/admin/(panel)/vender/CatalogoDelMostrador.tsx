'use client';

import { useState } from 'react';
import { formatearPesosEnteros } from '@/lib/plata';
import type { CategoriaParaVender, ProductoParaVender } from '@/lib/vender/catalogo';
import type { ItemDelCatalogo } from '@/lib/vender/ticket';
import { cn } from '@/lib/utils';

type Sumar = (item: ItemDelCatalogo) => void;

// Cada forma de venta es un botón grande: un toque suma una al ticket.
function ProductoDelMostrador({ producto, sumar }: { producto: ProductoParaVender; sumar: Sumar }) {
  return (
    <li className="rounded-2xl border border-border bg-secondary/20 p-3 space-y-2">
      <p className="text-sm font-bold wrap-break-word">{producto.nombre}</p>
      <div className="flex flex-wrap gap-2">
        {producto.formas.map((forma) => (
          <button
            type="button"
            key={forma.presentacionId}
            aria-label={`Sumar ${forma.nombre} · ${forma.presentacion}`}
            onClick={() => sumar(forma)}
            className="min-h-12 flex-1 rounded-xl border border-border bg-card px-3 py-2 text-left hover:border-primary/40 hover:shadow-md active:scale-95 transition-all"
          >
            <span className="block text-[11px] font-semibold text-muted-foreground">
              {forma.presentacion}
            </span>
            <span className="block text-sm font-bold tabular-nums">
              {formatearPesosEnteros(forma.precioCentavos)}
            </span>
          </button>
        ))}
      </div>
    </li>
  );
}

type Props = { catalogo: CategoriaParaVender[]; sumar: Sumar };

/** Las categorías del menú, una por vez, con sus productos para tocar. */
export function CatalogoDelMostrador({ catalogo, sumar }: Props) {
  const [elegida, setElegida] = useState(catalogo[0]!.id);
  const categoria = catalogo.find((c) => c.id === elegida) ?? catalogo[0]!;
  return (
    <section
      aria-label="Productos"
      className="bg-card rounded-[2rem] border border-border/60 shadow-xl p-4 md:p-6 space-y-5"
    >
      {/* Bajan de renglón en vez de deslizarse: en el mostrador, una categoría escondida no se ve. */}
      <div
        role="group"
        aria-label="Categorías"
        className="flex flex-wrap gap-1 p-1.5 rounded-2xl bg-secondary/40"
      >
        {catalogo.map((c) => (
          <button
            type="button"
            key={c.id}
            aria-pressed={c.id === categoria.id}
            onClick={() => setElegida(c.id)}
            className={cn(
              'shrink-0 min-h-11 px-4 rounded-xl text-sm font-bold transition-all',
              c.id === categoria.id
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {c.nombre}
          </button>
        ))}
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {categoria.productos.map((producto) => (
          <ProductoDelMostrador key={producto.id} producto={producto} sumar={sumar} />
        ))}
      </ul>
    </section>
  );
}
