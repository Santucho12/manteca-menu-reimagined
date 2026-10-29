'use client';

import { Plus, Trash2 } from 'lucide-react';
import {
  Controller,
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form';
import { ErrorDeCampo } from '@/components/formularios/Campo';
import { ACCESO_SECUNDARIO, ICONO_DE_ACCESO_SUAVE } from '@/components/panel/estilos';
import { atributosDeError } from '@/lib/formularios/accesibilidad';
import { montoParaEditar } from '@/lib/gastos/plata';
import type { DatosDeVenta } from '@/lib/ventas/esquemas';
import type { OpcionDeVenta } from '@/lib/ventas/opciones';
import { SelectorDeProducto } from './SelectorDeProducto';

type Props = {
  control: Control<DatosDeVenta>;
  register: UseFormRegister<DatosDeVenta>;
  setValue: UseFormSetValue<DatosDeVenta>;
  errors: FieldErrors<DatosDeVenta>;
  opciones: OpcionDeVenta[];
};

const COLUMNAS = 'grid grid-cols-[1fr_5.5rem_8rem_2.25rem] items-center gap-2';
const CAMPO =
  'h-11 w-full min-w-0 rounded-xl border border-border bg-secondary/30 px-3 text-sm font-semibold outline-hidden transition-colors focus:border-[#d8cdb6] focus:bg-white';
const TITULO = 'px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground';
const QUITAR =
  'flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95';

type ErroresProps = {
  indice: number;
  errores: FieldErrors<DatosDeVenta['renglones'][number]> | undefined;
};

function ErroresDeRenglon({ indice, errores }: ErroresProps) {
  return (
    <>
      <ErrorDeCampo id={`producto-${indice}`} error={errores?.opcion?.message} />
      <ErrorDeCampo id={`cantidad-${indice}`} error={errores?.cantidad?.message} />
      <ErrorDeCampo id={`precio-${indice}`} error={errores?.precio?.message} />
    </>
  );
}

/** Los productos de la venta, uno por línea: producto, cantidad y precio, que viene del menú. */
export function RenglonesDeVenta({ control, register, setValue, errors, opciones }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'renglones' });
  const alElegir = (i: number, valor: string) => {
    const opcion = opciones.find((o) => o.valor === valor);
    if (opcion) setValue(`renglones.${i}.precio`, montoParaEditar(opcion.precioCentavos));
  };
  const error = (i: number) => errors.renglones?.[i];
  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">Productos</legend>
      <div aria-hidden="true" className={`${COLUMNAS} hidden sm:grid`}>
        <span className={TITULO}>Producto</span>
        <span className={TITULO}>Cantidad</span>
        <span className={TITULO}>Precio</span>
      </div>
      {fields.map((renglon, i) => (
        <div key={renglon.id} className="space-y-1">
          <div className={COLUMNAS}>
            <Controller
              control={control}
              name={`renglones.${i}.opcion`}
              render={({ field }) => (
                <SelectorDeProducto
                  etiqueta={`Producto ${i + 1}`}
                  opciones={opciones}
                  valor={field.value}
                  invalido={Boolean(error(i)?.opcion)}
                  alElegir={(valor) => {
                    field.onChange(valor);
                    alElegir(i, valor);
                  }}
                />
              )}
            />
            <input
              id={`cantidad-${i}`}
              aria-label={`Cantidad ${i + 1}`}
              inputMode="decimal"
              {...atributosDeError(`cantidad-${i}`, error(i)?.cantidad?.message)}
              {...register(`renglones.${i}.cantidad`)}
              className={`${CAMPO} text-center`}
            />
            <input
              id={`precio-${i}`}
              aria-label={`Precio ${i + 1}`}
              inputMode="decimal"
              placeholder="$"
              {...atributosDeError(`precio-${i}`, error(i)?.precio?.message)}
              {...register(`renglones.${i}.precio`)}
              className={CAMPO}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Quitar producto ${i + 1}`}
              className={QUITAR}
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
          <ErroresDeRenglon indice={i} errores={error(i)} />
        </div>
      ))}
      {errors.renglones?.message ? (
        <p className="text-xs font-medium text-rose-600">{errors.renglones.message}</p>
      ) : null}
      <button
        type="button"
        onClick={() => append({ opcion: '', cantidad: '1', precio: '' })}
        className={`${ACCESO_SECUNDARIO} flex-none`}
      >
        <span className={ICONO_DE_ACCESO_SUAVE}>
          <Plus size={15} strokeWidth={2.6} aria-hidden="true" />
        </span>
        Sumar producto
      </button>
    </fieldset>
  );
}
