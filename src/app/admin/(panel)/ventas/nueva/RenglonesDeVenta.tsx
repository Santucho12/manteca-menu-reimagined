'use client';

import {
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form';
import { Campo } from '@/components/formularios/Campo';
import { CampoDeSeleccion } from '@/components/formularios/CampoDeSeleccion';
import { Button } from '@/components/ui/button';
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
    <fieldset className="space-y-3 rounded-lg border p-4">
      <legend className="px-1 font-medium">Productos</legend>
      {fields.map((renglon, i) => (
        <div key={renglon.id} className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
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
          <Button type="button" variant="outline" onClick={() => remove(i)}>
            Quitar
          </Button>
        </div>
      ))}
      {errors.renglones?.message ? (
        <p className="text-destructive text-sm">{errors.renglones.message}</p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        onClick={() => append({ opcion: '', cantidad: '1', precio: '' })}
      >
        Sumar producto
      </Button>
    </fieldset>
  );
}
