'use client';

import { Plus, Trash2 } from 'lucide-react';
import {
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form';
import { Campo } from '@/components/formularios/Campo';
import { CampoDeSeleccion } from '@/components/formularios/CampoDeSeleccion';
import { BOTON_PELIGRO, BOTON_SUAVE, ETIQUETA } from '@/components/panel/estilos';
import { montoParaEditar } from '@/lib/gastos/plata';
import type { DatosDeVenta } from '@/lib/ventas/esquemas';
import type { OpcionDeVenta } from '@/lib/ventas/opciones';

type Props = {
  control: Control<DatosDeVenta>;
  register: UseFormRegister<DatosDeVenta>;
  setValue: UseFormSetValue<DatosDeVenta>;
  errors: FieldErrors<DatosDeVenta>;
  opciones: OpcionDeVenta[];
};

/** Los productos de la venta: al elegir uno, el precio viene del menu y se puede cambiar. */
export function RenglonesDeVenta({ control, register, setValue, errors, opciones }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'renglones' });
  const elegir = [{ valor: '', texto: 'Elegí el producto' }, ...opciones];
  const alElegir = (i: number, valor: string) => {
    const opcion = opciones.find((o) => o.valor === valor);
    if (opcion) setValue(`renglones.${i}.precio`, montoParaEditar(opcion.precioCentavos));
  };
  return (
    <fieldset className="space-y-4">
      <legend className={`${ETIQUETA} mb-3`}>Productos</legend>
      {fields.map((renglon, i) => (
        <div
          key={renglon.id}
          className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_auto] gap-3 sm:items-end rounded-xl bg-secondary/40 p-3"
        >
          <CampoDeSeleccion
            id={`producto-${i}`}
            etiqueta={`Producto ${i + 1}`}
            opciones={elegir}
            error={errors.renglones?.[i]?.opcion?.message}
            {...register(`renglones.${i}.opcion`, { onChange: (e) => alElegir(i, e.target.value) })}
          />
          <Campo
            id={`cantidad-${i}`}
            etiqueta={`Cantidad ${i + 1}`}
            inputMode="decimal"
            error={errors.renglones?.[i]?.cantidad?.message}
            {...register(`renglones.${i}.cantidad`)}
          />
          <Campo
            id={`precio-${i}`}
            etiqueta={`Precio ${i + 1}`}
            inputMode="decimal"
            error={errors.renglones?.[i]?.precio?.message}
            {...register(`renglones.${i}.precio`)}
          />
          <button type="button" onClick={() => remove(i)} className={BOTON_PELIGRO}>
            <Trash2 size={16} aria-hidden="true" /> Quitar
          </button>
        </div>
      ))}
      {errors.renglones?.message ? (
        <p className="text-xs text-rose-600 font-medium">{errors.renglones.message}</p>
      ) : null}
      <button
        type="button"
        onClick={() => append({ opcion: '', cantidad: '1', precio: '' })}
        className={BOTON_SUAVE}
      >
        <Plus size={14} aria-hidden="true" /> Sumar producto
      </button>
    </fieldset>
  );
}
