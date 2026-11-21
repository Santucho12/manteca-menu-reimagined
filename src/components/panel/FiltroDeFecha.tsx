'use client';

import { CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { fechaDiaMesAnio } from '@/lib/fechaDelFiltro';
import { cn } from '@/lib/utils';
import { CAMPO_DE_FILTRO } from './estilos';

type Props = { id: string; name: string; etiqueta: string; valor: string };

/**
 * El calendario del navegador escribe la fecha según su idioma (en inglés, mes/día/año). Encima se
 * muestra siempre día/mes/año; el campo de verdad queda transparente arriba y abre el calendario.
 */
export function FiltroDeFecha({ id, name, etiqueta, valor }: Props) {
  // Si la fecha cambia desde afuera (un atajo como Este mes), se vuelve a leer de la URL.
  const [estado, setEstado] = useState({ valor, fecha: valor });
  if (estado.valor !== valor) setEstado({ valor, fecha: valor });
  const fecha = estado.fecha;
  return (
    <div className="space-y-1 xl:min-w-[170px] xl:flex-1">
      <label
        htmlFor={id}
        className="text-[10px] font-black text-muted-foreground uppercase tracking-widest"
      >
        {etiqueta}
      </label>
      <div
        className={cn(
          CAMPO_DE_FILTRO,
          'sm:w-full relative flex items-center justify-between gap-2 focus-within:ring-2',
        )}
      >
        <span aria-hidden="true" className="tabular-nums">
          {fechaDiaMesAnio(fecha)}
        </span>
        <CalendarDays size={16} aria-hidden="true" className="shrink-0 text-muted-foreground" />
        <input
          key={valor}
          id={id}
          name={name}
          type="date"
          defaultValue={valor}
          onChange={(evento) => setEstado({ valor, fecha: evento.currentTarget.value })}
          onClick={(evento) => evento.currentTarget.showPicker()}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
    </div>
  );
}
