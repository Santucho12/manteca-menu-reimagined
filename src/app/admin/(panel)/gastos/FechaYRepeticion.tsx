'use client';

import { Controller, useWatch, type Control, type FieldErrors } from 'react-hook-form';
import { CampoDeFecha } from '@/components/formularios/CampoDeFecha';
import { OpcionesQueSeTocan } from '@/components/formularios/OpcionesQueSeTocan';
import type { DatosDeCarga } from '@/lib/gastos/esquemas';
import { resumenDeRepeticion } from '@/lib/gastos/fijos';
import { opcionesDeFrecuencia } from '@/lib/gastos/pantalla';
import { sumarDias } from '@/lib/reportes/periodos';

const REPETICION = [{ valor: 'no', texto: 'No' }, ...opcionesDeFrecuencia()];

type Props = {
  control: Control<DatosDeCarga>;
  errors: FieldErrors<DatosDeCarga>;
  hoy: string;
  /** Solo al cargar se elige si se repite: un gasto ya cargado es de un pago. */
  nuevo: boolean;
  deCaja: boolean;
};

/** La fecha, con Hoy y Ayer, y "¿Se repite?" con la frase de lo que va a pasar. */
export function FechaYRepeticion({ control, errors, hoy, nuevo, deCaja }: Props) {
  const [fecha, seRepite] = useWatch({ control, name: ['fecha', 'seRepite'] });
  const atajos = deCaja
    ? []
    : [
        { texto: 'Hoy', fecha: hoy },
        { texto: 'Ayer', fecha: sumarDias(hoy, -1) },
      ];
  return (
    <>
      <Controller
        control={control}
        name="fecha"
        render={({ field }) => (
          <CampoDeFecha
            id="fecha"
            etiqueta="Fecha"
            valor={field.value}
            alCambiar={field.onChange}
            hasta={seRepite === 'no' ? hoy : undefined}
            atajos={atajos}
            deshabilitado={deCaja}
            error={errors.fecha?.message}
          />
        )}
      />
      {nuevo ? (
        <div className="space-y-2">
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
          {seRepite !== 'no' ? (
            <p className="text-xs text-muted-foreground">
              {resumenDeRepeticion(fecha, seRepite, hoy)}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
