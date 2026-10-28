'use client';

import { Controller, type Control } from 'react-hook-form';
import { OpcionesQueSeTocan } from '@/components/formularios/OpcionesQueSeTocan';
import type { DatosDeCarga } from '@/lib/gastos/esquemas';
import { opcionesDeFrecuencia } from '@/lib/gastos/pantalla';

const REPETICION = [{ valor: 'no', texto: 'No' }, ...opcionesDeFrecuencia()];
const PAGADO = [
  { valor: 'si', texto: 'Sí' },
  { valor: 'no', texto: 'Todavía no' },
];

/** "¿Se repite?" y, si no se repite, "¿Ya lo pagaste?": un fijo deja cada pago por pagar. */
export function PreguntasDeCarga({
  control,
  seRepite,
}: {
  control: Control<DatosDeCarga>;
  seRepite: string;
}) {
  return (
    <div className="space-y-4">
      <Controller
        control={control}
        name="seRepite"
        render={({ field }) => (
          <OpcionesQueSeTocan
            nombre="seRepite"
            etiqueta="¿Se repite?"
            opciones={REPETICION}
            valor={field.value}
            alCambiar={field.onChange}
          />
        )}
      />
      {seRepite === 'no' ? (
        <Controller
          control={control}
          name="yaPagado"
          render={({ field }) => (
            <OpcionesQueSeTocan
              nombre="yaPagado"
              etiqueta="¿Ya lo pagaste?"
              opciones={PAGADO}
              valor={field.value}
              alCambiar={field.onChange}
            />
          )}
        />
      ) : null}
    </div>
  );
}
