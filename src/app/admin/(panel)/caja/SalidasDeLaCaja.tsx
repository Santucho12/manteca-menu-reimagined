'use client';

import { ArrowUpRight, Plus, Trash2 } from 'lucide-react';
import { useFieldArray, type Control, type FieldErrors } from 'react-hook-form';
import { Campo } from '@/components/formularios/Campo';
import { BOTON_SUAVE, ICONO_BORRAR } from '@/components/panel/estilos';
import type { DatosDeCierre } from '@/lib/caja/esquemas';
import type { Registro } from '@/lib/formularios/valorInicial';
import { Bloque } from './Piezas';

type Props = {
  control: Control<DatosDeCierre>;
  registro: Registro<DatosDeCierre>;
  errors: FieldErrors<DatosDeCierre>;
};

const FILA = 'grid grid-cols-[1fr_1.4fr_auto] items-end gap-3';

/** Los retiros de efectivo del turno: cuánto y quién. */
function Retiros({ control, registro, errors }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'retiros' });
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold">Retiros</h3>
      {fields.map((retiro, i) => (
        <div key={retiro.id} className={FILA}>
          <Campo
            id={`retiro-${i}-monto`}
            etiqueta="Monto"
            inputMode="decimal"
            error={errors.retiros?.[i]?.monto?.message}
            {...registro(`retiros.${i}.monto`)}
          />
          <Campo
            id={`retiro-${i}-quien`}
            etiqueta="Quién retiró"
            error={errors.retiros?.[i]?.quien?.message}
            {...registro(`retiros.${i}.quien`)}
          />
          <button
            type="button"
            aria-label="Sacar el retiro"
            onClick={() => remove(i)}
            className={`${ICONO_BORRAR} mb-2.5`}
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => append({ monto: '', quien: '' })}
        className={BOTON_SUAVE}
      >
        <Plus size={14} aria-hidden="true" /> Agregar retiro
      </button>
    </div>
  );
}

/** Los gastos pagados con la plata de la caja: cuánto y en qué. */
function Gastos({ control, registro, errors }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'gastos' });
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold">Gastos pagados con la caja</h3>
      {fields.map((gasto, i) => (
        <div key={gasto.id} className={FILA}>
          <Campo
            id={`gasto-${i}-monto`}
            etiqueta="Monto"
            inputMode="decimal"
            error={errors.gastos?.[i]?.monto?.message}
            {...registro(`gastos.${i}.monto`)}
          />
          <Campo
            id={`gasto-${i}-descripcion`}
            etiqueta="En qué se gastó"
            error={errors.gastos?.[i]?.descripcion?.message}
            {...registro(`gastos.${i}.descripcion`)}
          />
          <button
            type="button"
            aria-label="Sacar el gasto"
            onClick={() => remove(i)}
            className={`${ICONO_BORRAR} mb-2.5`}
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => append({ monto: '', descripcion: '' })}
        className={BOTON_SUAVE}
      >
        <Plus size={14} aria-hidden="true" /> Agregar gasto
      </button>
    </div>
  );
}

/** Lo que salió de la caja durante el turno: retiros en un lado, gastos en el otro. */
export function SalidasDeLaCaja(props: Props) {
  return (
    <Bloque
      titulo="Lo que salió de la caja"
      ayuda="Efectivo que se sacó o se usó para pagar algo durante el turno."
      icono={ArrowUpRight}
      tono="mal"
    >
      <div className="grid gap-6 lg:grid-cols-2 lg:divide-x lg:divide-border">
        <Retiros {...props} />
        <div className="lg:pl-6">
          <Gastos {...props} />
        </div>
      </div>
    </Bloque>
  );
}
