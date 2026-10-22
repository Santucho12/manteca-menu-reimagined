'use client';

import { useFormContext } from 'react-hook-form';
import { ETIQUETA } from '@/components/panel/estilos';
import type { DatosDeCategoria } from '@/lib/menu/esquemas';
import { ICONOS } from '@/lib/menu/iconos';

export function SelectorDeIcono() {
  const { register } = useFormContext<DatosDeCategoria>();
  return (
    <fieldset className="space-y-3">
      <legend className={ETIQUETA}>Ícono</legend>
      <div className="flex flex-wrap gap-2">
        {ICONOS.map((icono) => (
          <label
            key={icono}
            className="has-checked:border-primary has-checked:bg-primary/10 has-focus-visible:ring-2 has-focus-visible:ring-primary/40 relative flex size-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-secondary/30 text-xl transition-all"
          >
            {/* Transparente y encima de toda la opcion: se toca en cualquier parte y se ve el foco. */}
            <input
              type="radio"
              value={icono}
              aria-label={icono}
              className="absolute inset-0 cursor-pointer appearance-none rounded-xl"
              {...register('icono')}
            />
            <span aria-hidden="true">{icono}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
