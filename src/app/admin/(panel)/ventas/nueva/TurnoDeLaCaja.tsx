'use client';

import type { Control, UseFormRegister } from 'react-hook-form';
import type { DatosDeVenta } from '@/lib/ventas/esquemas';

type Props = { control: Control<DatosDeVenta>; register: UseFormRegister<DatosDeVenta> };

/** En qué turno se vendió: cuenta para el cierre de ese turno, en la caja o en su tipo (pedido 99). */
export function TurnoDeLaCaja({ register }: Props) {
  return (
    <label htmlFor="turno" className="flex flex-wrap items-center gap-3 text-sm font-semibold">
      Turno
      <select
        id="turno"
        className="h-10 rounded-xl border border-border bg-white px-3 text-sm font-medium"
        {...register('turno')}
      >
        <option value="1">Mediodía</option>
        <option value="2">Noche</option>
      </select>
    </label>
  );
}
