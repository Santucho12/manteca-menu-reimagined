'use client';

import type { ReactNode } from 'react';
import {
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form';
import { Campo } from '@/components/formularios/Campo';
import { Button } from '@/components/ui/button';
import type { DatosDeCierre } from '@/lib/caja/esquemas';

type Props = {
  control: Control<DatosDeCierre>;
  register: UseFormRegister<DatosDeCierre>;
  errors: FieldErrors<DatosDeCierre>;
};

function Grupo({
  titulo,
  ayuda,
  children,
}: {
  titulo: string;
  ayuda: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="space-y-3 rounded-lg border p-4">
      <legend className="px-1 font-medium">{titulo}</legend>
      <p className="text-muted-foreground text-sm">{ayuda}</p>
      {children}
    </fieldset>
  );
}

/** El efectivo que se saco de la caja en el dia, con quien lo retiro. */
export function Retiros({ control, register, errors }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'retiros' });
  return (
    <Grupo titulo="Retiros" ayuda="Efectivo que se sacó de la caja durante el día.">
      {fields.map((retiro, i) => (
        <div key={retiro.id} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Campo
            id={`retiro-monto-${i}`}
            etiqueta={`Monto del retiro ${i + 1}`}
            inputMode="decimal"
            error={errors.retiros?.[i]?.monto?.message}
            {...register(`retiros.${i}.monto`)}
          />
          <Campo
            id={`retiro-quien-${i}`}
            etiqueta={`Quién retiró ${i + 1}`}
            error={errors.retiros?.[i]?.quien?.message}
            {...register(`retiros.${i}.quien`)}
          />
          <Button type="button" variant="outline" onClick={() => remove(i)}>
            Quitar
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => append({ monto: '', quien: '' })}>
        Sumar retiro
      </Button>
    </Grupo>
  );
}

/** Lo que se pago con plata de la caja: pasa a Gastos, donde el admin lo clasifica. */
export function GastosDeCaja({ control, register, errors }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'gastos' });
  return (
    <Grupo titulo="Gastos pagados con la caja" ayuda="Lo que se pagó con efectivo de la caja.">
      {fields.map((gasto, i) => (
        <div key={gasto.id} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Campo
            id={`gasto-monto-${i}`}
            etiqueta={`Monto del gasto ${i + 1}`}
            inputMode="decimal"
            error={errors.gastos?.[i]?.monto?.message}
            {...register(`gastos.${i}.monto`)}
          />
          <Campo
            id={`gasto-descripcion-${i}`}
            etiqueta={`En qué se gastó ${i + 1}`}
            error={errors.gastos?.[i]?.descripcion?.message}
            {...register(`gastos.${i}.descripcion`)}
          />
          <Button type="button" variant="outline" onClick={() => remove(i)}>
            Quitar
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => append({ monto: '', descripcion: '' })}
      >
        Sumar gasto
      </Button>
    </Grupo>
  );
}
