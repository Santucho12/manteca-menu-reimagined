'use client';

import { Plus } from 'lucide-react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { BOTON_SUAVE, ETIQUETA } from '@/components/panel/estilos';
import type { DatosDeCategoria } from '@/lib/menu/esquemas';
import { cn } from '@/lib/utils';
import { FormaDeVenta, columnasDeFormas } from './FormaDeVenta';

// Los titulos de columna son para la vista: cada campo ya lleva su nombre para el lector.
function Encabezados({ conPrecio }: { conPrecio: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn(columnasDeFormas(conPrecio), 'text-xs font-semibold text-muted-foreground')}
    >
      <span>Se vende por</span>
      {conPrecio ? <span>Precio para todos</span> : null}
    </div>
  );
}

/** Como se vende lo de la categoria (Unidad, Docena...) y, si es igual para todos, su precio. */
export function EditorDePresentaciones() {
  const { control, formState } = useFormContext<DatosDeCategoria>();
  const { fields, append, remove, move } = useFieldArray({ control, name: 'presentaciones' });
  const conPrecio = useWatch({ control, name: 'precioCompartido' });
  const errores = formState.errors.presentaciones;
  const general = errores?.root?.message ?? errores?.message;
  return (
    <fieldset className="space-y-2">
      <legend className={`${ETIQUETA} mb-3`}>Cómo se vende</legend>
      <Encabezados conPrecio={conPrecio} />
      {fields.map((campo, i) => (
        <FormaDeVenta
          key={campo.id}
          i={i}
          total={fields.length}
          conPrecio={conPrecio}
          quitar={remove}
          mover={move}
        />
      ))}
      {general ? <p className="text-xs text-rose-600 font-medium">{general}</p> : null}
      <button
        type="button"
        onClick={() =>
          append({
            id: '',
            nombre: '',
            compartido: '',
            compartidoOriginal: '',
            medida: '',
            cantidad: '',
          })
        }
        disabled={fields.length >= 6}
        className={cn(BOTON_SUAVE, 'mt-2')}
      >
        <Plus size={14} aria-hidden="true" /> Agregar otra forma de venta
      </button>
    </fieldset>
  );
}
