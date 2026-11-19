'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { CampoDeSeleccion } from '@/components/formularios/CampoDeSeleccion';
import { BOTON_CANCELAR, ICONO_EDITAR } from '@/components/panel/estilos';
import type { FormaParaComprar } from '@/lib/compras/consultas';
import { opcionesDeFormas } from '@/lib/compras/pantalla';

type ConRenglones = { renglones: { formaId: string; cantidad: string; precio: string }[] };
type Props = {
  formulario: UseFormReturn<ConRenglones>;
  formas: FormaParaComprar[];
  conPrecio: boolean;
};

function Renglon({
  formulario,
  formas,
  conPrecio,
  indice,
  quitar,
}: Props & {
  indice: number;
  quitar: () => void;
}) {
  const errores = formulario.formState.errors.renglones?.[indice];
  const columnas = conPrecio ? 'sm:grid-cols-[1fr_7rem_9rem_auto]' : 'sm:grid-cols-[1fr_7rem_auto]';
  return (
    <div className={`grid grid-cols-1 ${columnas} items-end gap-3`}>
      <CampoDeSeleccion
        id={`forma-${indice}`}
        etiqueta={`Qué llegó ${indice + 1}`}
        opciones={opcionesDeFormas(formas)}
        error={errores?.formaId?.message}
        {...formulario.register(`renglones.${indice}.formaId`)}
      />
      <Campo
        id={`cantidad-${indice}`}
        etiqueta={`Cantidad ${indice + 1}`}
        inputMode="decimal"
        error={errores?.cantidad?.message}
        {...formulario.register(`renglones.${indice}.cantidad`)}
      />
      {conPrecio ? (
        <Campo
          id={`precio-${indice}`}
          etiqueta={`Precio ${indice + 1}`}
          inputMode="decimal"
          error={errores?.precio?.message}
          {...formulario.register(`renglones.${indice}.precio`)}
        />
      ) : null}
      <button
        type="button"
        onClick={quitar}
        aria-label={`Quitar renglón ${indice + 1}`}
        className={ICONO_EDITAR}
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

/** Los renglones de una compra o de un pedido: que forma de compra, cuanto y a que precio. */
export function Renglones(props: Props) {
  const renglones = useFieldArray({ control: props.formulario.control, name: 'renglones' });
  const error = props.formulario.formState.errors.renglones?.message;
  return (
    <div className="space-y-3">
      {renglones.fields.map((campo, indice) => (
        <Renglon
          key={campo.id}
          {...props}
          indice={indice}
          quitar={() => renglones.remove(indice)}
        />
      ))}
      {error ? <AvisoDeError mensaje={error} /> : null}
      <button
        type="button"
        onClick={() => renglones.append({ formaId: '', cantidad: '', precio: '' })}
        className={BOTON_CANCELAR}
      >
        <Plus size={14} aria-hidden="true" /> Agregar renglón
      </button>
    </div>
  );
}
