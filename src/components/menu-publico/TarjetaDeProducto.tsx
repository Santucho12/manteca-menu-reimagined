'use client';

import { useState } from 'react';
import { disposicionDePrecios } from '@/lib/menu/disposicion';
import type { ProductoPublico } from '@/lib/menu/publico';
import { PreciosDelProducto } from './PreciosDelProducto';

export function TarjetaDeProducto({ producto }: { producto: ProductoPublico }) {
  const [abierta, setAbierta] = useState(false);
  const disposicion = disposicionDePrecios(producto.precios.length);
  const cabecera = (
    <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      <span className="text-[0.9rem] leading-tight font-medium">{producto.nombre}</span>
      {producto.etiqueta ? <span className="etiqueta-del-menu">{producto.etiqueta}</span> : null}
      {producto.descripcion ? (
        <span
          aria-hidden="true"
          className={`text-muted-foreground text-xs transition-transform ${abierta ? 'rotate-180' : ''}`}
        >
          ⌄
        </span>
      ) : null}
    </span>
  );
  return (
    // La tarjeta mide su propio ancho (@container): ahí se decide dónde van los precios.
    <li className={`tarjeta-del-menu @container ${abierta ? 'border-accent' : ''}`}>
      <div className={`flex w-full gap-3 ${disposicion.fila}`}>
        {producto.descripcion ? (
          <button
            type="button"
            aria-expanded={abierta}
            onClick={() => setAbierta(!abierta)}
            className="flex min-h-11 flex-1 text-left"
          >
            {cabecera}
          </button>
        ) : (
          cabecera
        )}
        <PreciosDelProducto precios={producto.precios} className={disposicion.precios} />
      </div>
      {abierta && producto.descripcion ? (
        <p className="text-muted-foreground border-accent/30 mt-3 border-l-2 pl-3 text-xs leading-relaxed italic">
          {producto.descripcion}
        </p>
      ) : null}
    </li>
  );
}
