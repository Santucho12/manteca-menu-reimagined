'use client';

import { useFormContext } from 'react-hook-form';
import type { DatosDeCategoria } from '@/lib/menu/esquemas';
import { ICONOS } from '@/lib/menu/iconos';

export function SelectorDeIcono() {
  const { register } = useFormContext<DatosDeCategoria>();
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Ícono</legend>
      <div className="flex flex-wrap gap-2">
        {ICONOS.map((icono) => (
          <label
            key={icono}
            className="has-checked:border-primary has-checked:bg-secondary has-focus-visible:ring-ring relative flex size-11 cursor-pointer items-center justify-center rounded-lg border text-xl has-focus-visible:ring-2"
          >
            {/* Transparente y encima de toda la opcion: se toca en cualquier parte y se ve el foco. */}
            <input
              type="radio"
              value={icono}
              aria-label={icono}
              className="absolute inset-0 cursor-pointer appearance-none rounded-lg"
              {...register('icono')}
            />
            <span aria-hidden="true">{icono}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
