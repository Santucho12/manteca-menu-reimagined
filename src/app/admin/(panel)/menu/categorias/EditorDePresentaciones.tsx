'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Campo } from '@/components/formularios/Campo';
import { BOTON_SUAVE, ETIQUETA, ICONO_BORRAR, ICONO_DE_ACCION } from '@/components/panel/estilos';
import type { DatosDeCategoria } from '@/lib/menu/esquemas';

function Mover({
  i,
  total,
  mover,
}: {
  i: number;
  total: number;
  mover: (a: number, b: number) => void;
}) {
  return (
    <>
      <button
        type="button"
        aria-label={`Subir la presentación ${i + 1}`}
        disabled={i === 0}
        onClick={() => mover(i, i - 1)}
        className={ICONO_DE_ACCION}
      >
        <ArrowUp size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label={`Bajar la presentación ${i + 1}`}
        disabled={i === total - 1}
        onClick={() => mover(i, i + 1)}
        className={ICONO_DE_ACCION}
      >
        <ArrowDown size={16} aria-hidden="true" />
      </button>
    </>
  );
}

export function EditorDePresentaciones() {
  const { control, register, formState } = useFormContext<DatosDeCategoria>();
  const { fields, append, remove, move } = useFieldArray({ control, name: 'presentaciones' });
  const compartido = useWatch({ control, name: 'precioCompartido' });
  const errores = formState.errors.presentaciones;
  const general = errores?.root?.message ?? errores?.message;
  return (
    <fieldset className="space-y-4">
      <legend className={`${ETIQUETA} mb-3`}>Presentaciones</legend>
      {fields.map((campo, i) => (
        <div key={campo.id} className="space-y-3 rounded-xl bg-secondary/40 p-3">
          <Campo
            id={`presentacion-${i}`}
            etiqueta={`Nombre de la presentación ${i + 1}`}
            error={errores?.[i]?.nombre?.message}
            {...register(`presentaciones.${i}.nombre`)}
          />
          {compartido ? (
            <Campo
              id={`compartido-${i}`}
              etiqueta={`Precio compartido de la presentación ${i + 1}`}
              inputMode="numeric"
              error={errores?.[i]?.compartido?.message}
              {...register(`presentaciones.${i}.compartido`)}
            />
          ) : null}
          <div className="flex items-center gap-1">
            <Mover i={i} total={fields.length} mover={move} />
            <button
              type="button"
              aria-label={`Quitar la presentación ${i + 1}`}
              disabled={fields.length === 1}
              onClick={() => remove(i)}
              className={ICONO_BORRAR}
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      ))}
      {general ? <p className="text-xs text-rose-600 font-medium">{general}</p> : null}
      <button
        type="button"
        onClick={() => append({ id: '', nombre: '', compartido: '', compartidoOriginal: '' })}
        disabled={fields.length >= 6}
        className={BOTON_SUAVE}
      >
        <Plus size={14} aria-hidden="true" /> Agregar presentación
      </button>
    </fieldset>
  );
}
