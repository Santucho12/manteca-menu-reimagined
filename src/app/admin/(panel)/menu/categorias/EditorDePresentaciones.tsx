'use client';

import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Campo } from '@/components/formularios/Campo';
import { Button } from '@/components/ui/button';
import type { DatosDeCategoria } from '@/lib/menu/esquemas';

export function EditorDePresentaciones() {
  const { control, register, formState } = useFormContext<DatosDeCategoria>();
  const { fields, append, remove, move } = useFieldArray({ control, name: 'presentaciones' });
  const compartido = useWatch({ control, name: 'precioCompartido' });
  const errores = formState.errors.presentaciones;
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Presentaciones</legend>
      {fields.map((campo, i) => (
        <div key={campo.id} className="space-y-2 rounded-lg border p-3">
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
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={`Subir la presentación ${i + 1}`}
              disabled={i === 0}
              onClick={() => move(i, i - 1)}
            >
              ↑
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={`Bajar la presentación ${i + 1}`}
              disabled={i === fields.length - 1}
              onClick={() => move(i, i + 1)}
            >
              ↓
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={`Quitar la presentación ${i + 1}`}
              disabled={fields.length === 1}
              onClick={() => remove(i)}
            >
              Quitar
            </Button>
          </div>
        </div>
      ))}
      {(errores?.root?.message ?? errores?.message) ? (
        <p className="text-destructive text-sm">{errores?.root?.message ?? errores?.message}</p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        onClick={() => append({ id: '', nombre: '', compartido: '' })}
        disabled={fields.length >= 6}
      >
        Agregar presentación
      </Button>
    </fieldset>
  );
}
