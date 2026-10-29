'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form';
import { Campo } from '@/components/formularios/Campo';
import { BOTON_PELIGRO, BOTON_SUAVE, ETIQUETA } from '@/components/panel/estilos';
import type { DatosDeCierre } from '@/lib/caja/esquemas';
import { CAMPO_CONTRASTADO } from './contraste';

type Props = {
  control: Control<DatosDeCierre>;
  register: UseFormRegister<DatosDeCierre>;
  errors: FieldErrors<DatosDeCierre>;
};

const FILA =
  'grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 sm:items-end rounded-xl bg-secondary/40 p-3';

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
    <fieldset className="space-y-4">
      <legend className={`${ETIQUETA} mb-1`}>{titulo}</legend>
      <p className="text-xs text-muted-foreground">{ayuda}</p>
      {children}
    </fieldset>
  );
}

function Quitar({ alTocar }: { alTocar: () => void }) {
  return (
    <button type="button" onClick={alTocar} className={BOTON_PELIGRO}>
      <Trash2 size={16} aria-hidden="true" /> Quitar
    </button>
  );
}

// Cada tipo de salida tiene su color para no confundir un retiro con un gasto.
const COLOR_DE_RETIRO = 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200';
const COLOR_DE_GASTO = 'bg-violet-100 text-violet-900 border border-violet-300 hover:bg-violet-200';

type PropsDeSumar = { alTocar: () => void; color: string; children: ReactNode };

function Sumar({ alTocar, color, children }: PropsDeSumar) {
  return (
    <button type="button" onClick={alTocar} className={`${BOTON_SUAVE} ${color}`}>
      <Plus size={14} aria-hidden="true" /> {children}
    </button>
  );
}

/** El efectivo que se saco de la caja en el dia, con quien lo retiro. */
export function Retiros({ control, register, errors }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'retiros' });
  return (
    <Grupo titulo="Retiros" ayuda="Efectivo que se sacó de la caja durante el día.">
      {fields.map((retiro, i) => (
        <div key={retiro.id} className={FILA}>
          <Campo
            className={CAMPO_CONTRASTADO}
            id={`retiro-monto-${i}`}
            etiqueta={`Monto del retiro ${i + 1}`}
            inputMode="decimal"
            error={errors.retiros?.[i]?.monto?.message}
            {...register(`retiros.${i}.monto`)}
          />
          <Campo
            className={CAMPO_CONTRASTADO}
            id={`retiro-quien-${i}`}
            etiqueta={`Quién retiró ${i + 1}`}
            error={errors.retiros?.[i]?.quien?.message}
            {...register(`retiros.${i}.quien`)}
          />
          <Quitar alTocar={() => remove(i)} />
        </div>
      ))}
      <Sumar color={COLOR_DE_RETIRO} alTocar={() => append({ monto: '', quien: '' })}>
        Sumar retiro
      </Sumar>
    </Grupo>
  );
}

/** Lo que se pago con plata de la caja: pasa a Gastos, donde el admin lo clasifica. */
export function GastosDeCaja({ control, register, errors }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'gastos' });
  return (
    <Grupo titulo="Gastos pagados con la caja" ayuda="Lo que se pagó con efectivo de la caja.">
      {fields.map((gasto, i) => (
        <div key={gasto.id} className={FILA}>
          <Campo
            className={CAMPO_CONTRASTADO}
            id={`gasto-monto-${i}`}
            etiqueta={`Monto del gasto ${i + 1}`}
            inputMode="decimal"
            error={errors.gastos?.[i]?.monto?.message}
            {...register(`gastos.${i}.monto`)}
          />
          <Campo
            className={CAMPO_CONTRASTADO}
            id={`gasto-descripcion-${i}`}
            etiqueta={`En qué se gastó ${i + 1}`}
            error={errors.gastos?.[i]?.descripcion?.message}
            {...register(`gastos.${i}.descripcion`)}
          />
          <Quitar alTocar={() => remove(i)} />
        </div>
      ))}
      <Sumar color={COLOR_DE_GASTO} alTocar={() => append({ monto: '', descripcion: '' })}>
        Sumar gasto
      </Sumar>
    </Grupo>
  );
}
