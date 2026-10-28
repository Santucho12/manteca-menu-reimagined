'use client';

import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useFormContext } from 'react-hook-form';
import { ErrorDeCampo } from '@/components/formularios/Campo';
import { CAMPO, ICONO_BORRAR, ICONO_DE_ACCION } from '@/components/panel/estilos';
import { atributosDeError } from '@/lib/formularios/accesibilidad';
import type { DatosDeCategoria } from '@/lib/menu/esquemas';
import { cn } from '@/lib/utils';

// Nombre y precio van en una sola linea. En el celular, con precio, las flechas bajan a la
// linea de abajo: si no, el nombre queda demasiado angosto. La columna de las flechas tiene
// ancho fijo (tres botones de 28 px) para que los titulos, que no la usan, queden alineados.
export const columnasDeFormas = (conPrecio: boolean) =>
  conPrecio
    ? 'grid grid-cols-[minmax(0,1fr)_7rem] sm:grid-cols-[minmax(0,1fr)_10rem_6rem] items-start gap-2'
    : 'grid grid-cols-[minmax(0,1fr)_6rem] items-start gap-2';

type PropsDeCampo = ComponentProps<'input'> & {
  id: string;
  etiqueta: string;
  error?: string;
  prefijo?: string;
};

// La etiqueta queda para el lector: a la vista van los titulos de columna, una sola vez.
function CampoEnLinea({ id, etiqueta, error, prefijo, ...props }: PropsDeCampo) {
  return (
    <div className="min-w-0 space-y-1">
      <label htmlFor={id} className="sr-only">
        {etiqueta}
      </label>
      <div className="relative">
        {prefijo ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground"
          >
            {prefijo}
          </span>
        ) : null}
        <input
          {...props}
          id={id}
          className={cn(CAMPO, prefijo && 'pl-8')}
          {...atributosDeError(id, error)}
        />
      </div>
      <ErrorDeCampo id={id} error={error} />
    </div>
  );
}

type PropsDeFila = {
  i: number;
  total: number;
  conPrecio: boolean;
  quitar: (i: number) => void;
  mover: (desde: number, hasta: number) => void;
};

function Acciones({ i, total, quitar, mover }: Omit<PropsDeFila, 'conPrecio'>) {
  return (
    <>
      <button
        type="button"
        aria-label={`Subir la forma de venta ${i + 1}`}
        disabled={i === 0}
        onClick={() => mover(i, i - 1)}
        className={ICONO_DE_ACCION}
      >
        <ArrowUp size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label={`Bajar la forma de venta ${i + 1}`}
        disabled={i === total - 1}
        onClick={() => mover(i, i + 1)}
        className={ICONO_DE_ACCION}
      >
        <ArrowDown size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label={`Quitar la forma de venta ${i + 1}`}
        disabled={total === 1}
        onClick={() => quitar(i)}
        className={ICONO_BORRAR}
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </>
  );
}

/** Una forma de venta de la categoria (Docena, Unidad...), con su precio si es para todos. */
export function FormaDeVenta({ i, total, conPrecio, quitar, mover }: PropsDeFila) {
  const { register, formState } = useFormContext<DatosDeCategoria>();
  const errores = formState.errors.presentaciones?.[i];
  return (
    <div className={columnasDeFormas(conPrecio)}>
      <CampoEnLinea
        id={`presentacion-${i}`}
        etiqueta={`Forma de venta ${i + 1}`}
        placeholder="Ej.: Docena"
        error={errores?.nombre?.message}
        {...register(`presentaciones.${i}.nombre`)}
      />
      {conPrecio ? (
        <CampoEnLinea
          id={`compartido-${i}`}
          etiqueta={`Precio de la forma de venta ${i + 1}`}
          prefijo="$"
          inputMode="numeric"
          error={errores?.compartido?.message}
          {...register(`presentaciones.${i}.compartido`)}
        />
      ) : null}
      <div
        className={cn(
          'flex items-center justify-end gap-1 sm:h-12',
          conPrecio ? 'col-span-2 sm:col-span-1' : 'h-12',
        )}
      >
        <Acciones i={i} total={total} quitar={quitar} mover={mover} />
      </div>
    </div>
  );
}
