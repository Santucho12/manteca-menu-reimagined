'use client';

import { ChevronDown, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatearPesos } from '@/lib/plata';
import { buscarOpciones } from '@/lib/ventas/buscarOpcion';
import type { OpcionDeVenta } from '@/lib/ventas/opciones';

type Props = {
  etiqueta: string;
  opciones: OpcionDeVenta[];
  valor: string;
  alElegir: (valor: string) => void;
  invalido?: boolean;
};

const DISPARADOR =
  'flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-border bg-secondary/30 px-3 text-left text-sm font-semibold outline-hidden transition-colors hover:bg-secondary/60 focus-visible:border-slate-300 data-[abierto=true]:border-slate-300 data-[abierto=true]:bg-white';
const OPCION =
  'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-secondary/70 data-[elegida=true]:bg-secondary';

// Se cierra al tocar afuera o con Escape.
function useCerrarAfuera(abierto: boolean, cerrar: () => void) {
  const caja = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => !caja.current?.contains(e.target as Node) && cerrar();
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && cerrar();
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto, cerrar]);
  return caja;
}

type ListaProps = { opciones: OpcionDeVenta[]; valor: string; etiqueta: string } & {
  elegir: (valor: string) => void;
};

function ListaDeProductos({ opciones, valor, etiqueta, elegir }: ListaProps) {
  const [escrito, setEscrito] = useState('');
  const coinciden = buscarOpciones(opciones, escrito);
  return (
    <div className="absolute left-0 top-full z-40 mt-2 w-full min-w-72 rounded-2xl border border-border bg-white p-1.5 shadow-2xl shadow-slate-900/10">
      <div className="relative mb-1">
        <Search
          size={15}
          aria-hidden="true"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          autoFocus
          value={escrito}
          onChange={(e) => setEscrito(e.target.value)}
          placeholder="Buscar producto..."
          aria-label="Buscar producto"
          className="h-10 w-full rounded-xl bg-secondary/40 pl-9 pr-3 text-sm font-medium outline-hidden"
        />
      </div>
      <div
        id={`lista-${etiqueta}`}
        role="listbox"
        aria-label="Productos"
        className="max-h-64 overflow-y-auto"
      >
        {coinciden.map((o) => (
          <button
            key={o.valor}
            type="button"
            role="option"
            aria-selected={o.valor === valor}
            data-elegida={o.valor === valor}
            onClick={() => elegir(o.valor)}
            className={OPCION}
          >
            <span className="font-semibold">{o.texto}</span>
            <span className="shrink-0 text-xs font-medium text-muted-foreground">
              {formatearPesos(o.precioCentavos)}
            </span>
          </button>
        ))}
        {coinciden.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">
            No hay productos con eso.
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Elegir el producto buscándolo: se escribe parte del nombre y la lista se acota sola. */
export function SelectorDeProducto({ etiqueta, opciones, valor, alElegir, invalido }: Props) {
  const [abierto, setAbierto] = useState(false);
  const caja = useCerrarAfuera(abierto, () => setAbierto(false));
  const elegida = opciones.find((o) => o.valor === valor);
  const elegir = (nueva: string) => {
    alElegir(nueva);
    setAbierto(false);
  };
  return (
    <div ref={caja} className="relative min-w-0">
      <button
        type="button"
        role="combobox"
        aria-label={etiqueta}
        aria-expanded={abierto}
        aria-controls={`lista-${etiqueta}`}
        aria-invalid={invalido || undefined}
        data-abierto={abierto}
        onClick={() => setAbierto(!abierto)}
        className={DISPARADOR}
      >
        <span className={`truncate ${elegida ? '' : 'text-muted-foreground'}`}>
          {elegida?.texto ?? 'Elegí el producto'}
        </span>
        <ChevronDown size={16} aria-hidden="true" className="shrink-0 text-muted-foreground" />
      </button>
      {abierto ? (
        <ListaDeProductos opciones={opciones} valor={valor} etiqueta={etiqueta} elegir={elegir} />
      ) : null}
    </div>
  );
}
