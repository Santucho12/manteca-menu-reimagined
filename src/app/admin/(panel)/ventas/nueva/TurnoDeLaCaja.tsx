'use client';

import { useWatch, type Control, type UseFormRegister } from 'react-hook-form';
import type { DatosDeVenta } from '@/lib/ventas/esquemas';

type Props = { control: Control<DatosDeVenta>; register: UseFormRegister<DatosDeVenta> };

/** Con «Se cobró en la caja» marcada, en qué turno: suma a lo esperado del cierre de ese turno. */
export function TurnoDeLaCaja({ control, register }: Props) {
  const enLaCaja = useWatch({ control, name: 'enLaCaja' });
  if (!enLaCaja) return null;
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
