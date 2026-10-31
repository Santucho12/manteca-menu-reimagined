'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LISTA_DE_DESPLEGABLE, OPCION_DE_DESPLEGABLE } from './estiloDeDesplegable';

type Props = {
  name: string;
  etiqueta: string;
  opciones: { valor: string; texto: string }[];
  valor: string;
  /** Clases que reemplazan a las del disparador: para un filtro con otra forma. */
  disparador?: string;
};

// Una opción no puede tener valor vacío: "Todos" viaja con esta marca y se manda como vacío.
const TODOS = '__todos__';
const DISPARADOR =
  'h-11 md:h-14 w-full rounded-xl md:rounded-2xl border-none bg-secondary/30 px-3 md:px-4 text-xs md:text-sm font-semibold transition-colors hover:bg-secondary/60 focus:ring-0 focus:ring-offset-0 data-[state=open]:bg-secondary/60';

/** Un filtro desplegable con la lista del panel: al elegir, la barra que lo contiene se envía sola. */
export function SelectorDeFiltro({ name, etiqueta, opciones, valor, disparador }: Props) {
  const [elegido, setElegido] = useState(valor || TODOS);
  const contenedor = useRef<HTMLDivElement>(null);
  const elValorInicial = useRef(valor || TODOS);
  useEffect(() => {
    if (elegido === elValorInicial.current) return;
    elValorInicial.current = elegido;
    contenedor.current?.closest('form')?.requestSubmit();
  }, [elegido]);
  return (
    <div ref={contenedor}>
      <input type="hidden" name={name} value={elegido === TODOS ? '' : elegido} />
      <Select value={elegido} onValueChange={setElegido}>
        <SelectTrigger aria-label={etiqueta} className={disparador ?? DISPARADOR}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start" sideOffset={8} className={LISTA_DE_DESPLEGABLE}>
          {opciones.map((o) => (
            <SelectItem
              key={o.valor || TODOS}
              value={o.valor || TODOS}
              className={OPCION_DE_DESPLEGABLE}
            >
              {o.texto}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
