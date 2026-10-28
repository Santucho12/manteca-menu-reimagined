'use client';

import { CalendarDays } from 'lucide-react';
import { Popover } from 'radix-ui';
import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { es } from 'react-day-picker/locale';
import { ATAJO, CAMPO, ETIQUETA } from '@/components/panel/estilos';
import { atributosDeError } from '@/lib/formularios/accesibilidad';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { cn } from '@/lib/utils';
import { aFecha, aTexto, CLASES_DEL_CALENDARIO, ETIQUETAS_DEL_CALENDARIO } from './calendario';
import { ErrorDeCampo } from './Campo';

type Props = {
  id: string;
  etiqueta: string;
  /** AAAA-MM-DD. */
  valor: string;
  alCambiar: (fecha: string) => void;
  /** Los días que se pueden elegir, inclusive. Hoy lo manda el servidor, no el navegador. */
  desde?: string;
  hasta?: string;
  atajos?: { texto: string; fecha: string }[];
  deshabilitado?: boolean;
  error?: string;
};

const fuera = (desde?: string, hasta?: string) => [
  ...(desde ? [{ before: aFecha(desde) }] : []),
  ...(hasta ? [{ after: aFecha(hasta) }] : []),
];

/** La fecha con un calendario propio, con los colores del panel, y atajos como "Hoy" y "Ayer". */
export function CampoDeFecha({ id, etiqueta, valor, alCambiar, desde, hasta, ...resto }: Props) {
  const { atajos = [], deshabilitado = false, error } = resto;
  const [abierto, setAbierto] = useState(false);
  const elegir = (fecha?: Date) => {
    if (!fecha) return;
    alCambiar(aTexto(fecha));
    setAbierto(false);
  };
  return (
    <div className="space-y-2">
      <label htmlFor={id} className={ETIQUETA}>
        {etiqueta}
      </label>
      <div className="flex gap-2">
        <Popover.Root open={abierto} onOpenChange={setAbierto}>
          <Popover.Trigger
            id={id}
            disabled={deshabilitado}
            {...atributosDeError(id, error)}
            className={cn(CAMPO, 'flex items-center justify-between text-left disabled:opacity-60')}
          >
            {fechaParaMostrar(valor)}
            <CalendarDays size={16} className="text-primary" aria-hidden="true" />
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              align="start"
              sideOffset={8}
              className="z-[120] rounded-2xl border border-border bg-card p-3 shadow-2xl"
            >
              <DayPicker
                mode="single"
                selected={aFecha(valor)}
                onSelect={elegir}
                defaultMonth={aFecha(valor)}
                locale={es}
                weekStartsOn={1}
                disabled={fuera(desde, hasta)}
                classNames={CLASES_DEL_CALENDARIO}
                labels={ETIQUETAS_DEL_CALENDARIO}
              />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        {atajos.map((atajo) => (
          <button
            key={atajo.texto}
            type="button"
            disabled={deshabilitado}
            onClick={() => alCambiar(atajo.fecha)}
            className={cn(ATAJO, 'h-12 disabled:opacity-50')}
          >
            {atajo.texto}
          </button>
        ))}
      </div>
      <ErrorDeCampo id={id} error={error} />
    </div>
  );
}
