'use client';

import { Scale } from 'lucide-react';
import { useState } from 'react';
import { formatearPesosEnteros } from '@/lib/plata';
import type { CategoriaParaVender, ProductoParaVender } from '@/lib/vender/catalogo';
import { tonoEnLista, type Tono } from '@/lib/vender/colores';
import { claveDe, type ItemDelCatalogo, type RenglonDelTicket } from '@/lib/vender/ticket';
import { cn } from '@/lib/utils';

type Elegir = (item: ItemDelCatalogo) => void;
type PropsDelProducto = {
  producto: ProductoParaVender;
  tono: Tono;
  ticket: RenglonDelTicket[];
  elegir: Elegir;
};

// Cada forma de venta es un botón con su precio: un toque suma una; lo pesado abre la balanza.
function ProductoDelMostrador({ producto, tono, ticket, elegir }: PropsDelProducto) {
  const enElTicket = (f: ItemDelCatalogo) => ticket.find((r) => claveDe(r) === claveDe(f));
  const lleva = producto.formas.some(enElTicket);
  // Surtidas va en negro: se distingue de las facturas sueltas (pedido 102).
  const surtidas = producto.id.startsWith('surtidas:');
  return (
    <li
      className={cn(
        'space-y-3 rounded-2xl border-2 p-3.5 transition-colors',
        surtidas
          ? 'border-foreground bg-foreground text-white'
          : lleva
            ? `${tono.borde} ${tono.suave}`
            : 'border-border bg-white',
      )}
    >
      <p className="text-[15px] font-bold wrap-break-word">{producto.nombre}</p>
      <div className="flex flex-wrap gap-2">
        {producto.formas.map((forma) => {
          const renglon = enElTicket(forma);
          return (
            <button
              type="button"
              key={forma.presentacionId}
              aria-label={`Sumar ${forma.nombre} · ${forma.presentacion}`}
              onClick={() => elegir(forma)}
              className={cn(
                'min-h-14 flex-1 rounded-xl px-3 py-2 text-left transition-all active:scale-95',
                renglon
                  ? `${tono.solido} text-white shadow-md`
                  : surtidas
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-secondary hover:bg-secondary/70',
              )}
            >
              <span
                className={cn(
                  'flex items-center gap-1 text-xs font-semibold',
                  renglon || surtidas ? 'text-white/90' : 'text-muted-foreground',
                )}
              >
                {forma.gramosDeLaForma ? <Scale size={12} aria-hidden="true" /> : null}
                {forma.presentacion}
                {renglon
                  ? ` · ${renglon.gramos ? `${renglon.gramos} g` : `×${renglon.cantidad}`}`
                  : ''}
              </span>
              <span className="block text-sm font-bold tabular-nums">
                {formatearPesosEnteros(forma.precioCentavos)}
              </span>
            </button>
          );
        })}
      </div>
    </li>
  );
}

type Props = { catalogo: CategoriaParaVender[]; ticket: RenglonDelTicket[]; elegir: Elegir };

/** Las categorías del menú, cada una con su color, y sus productos para tocar. */
export function CatalogoDelMostrador({ catalogo, ticket, elegir }: Props) {
  const [elegida, setElegida] = useState(catalogo[0]!.id);
  const indice = Math.max(
    0,
    catalogo.findIndex((c) => c.id === elegida),
  );
  const categoria = catalogo[indice]!;
  return (
    <section aria-label="Productos" className="space-y-4">
      {/* Bajan de renglón en vez de deslizarse: en el mostrador, una categoría escondida no se ve. */}
      <div role="group" aria-label="Categorías" className="flex flex-wrap gap-2">
        {catalogo.map((c, i) => {
          const tono = tonoEnLista(i);
          const actual = c.id === categoria.id;
          return (
            <button
              type="button"
              key={c.id}
              aria-pressed={actual}
              onClick={() => setElegida(c.id)}
              className={cn(
                'min-h-12 rounded-2xl border-2 px-4 text-sm font-bold transition-all active:scale-95',
                actual
                  ? `${tono.solido} border-transparent text-white shadow-md`
                  : `${tono.suave} ${tono.texto} border-transparent hover:brightness-95`,
              )}
            >
              {c.nombre}
            </button>
          );
        })}
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3">
        {categoria.productos.map((producto) => (
          <ProductoDelMostrador
            key={producto.id}
            producto={producto}
            tono={tonoEnLista(indice)}
            ticket={ticket}
            elegir={elegir}
          />
        ))}
      </ul>
    </section>
  );
}
