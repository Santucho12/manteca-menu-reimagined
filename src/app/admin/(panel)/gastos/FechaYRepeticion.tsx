'use client';

import { Controller, useWatch, type Control, type FieldErrors } from 'react-hook-form';
import { CampoDeFecha } from '@/components/formularios/CampoDeFecha';
import { quedaPorPagar, type DatosDeCarga } from '@/lib/gastos/esquemas';
import { resumenDeRepeticion } from '@/lib/gastos/fijos';
import { sumarDias } from '@/lib/reportes/periodos';
import { PreguntasDeCarga } from './PreguntasDeCarga';

type Props = {
  control: Control<DatosDeCarga>;
  errors: FieldErrors<DatosDeCarga>;
  hoy: string;
  /** Solo al cargar se elige si se repite y si ya se pagó: un gasto ya cargado es un pago. */
  nuevo: boolean;
  deCaja: boolean;
};

// Lo pagado mira para atrás; lo por pagar, para adelante.
/** Lo que se carga dice si es cuando vence o cuando se pagó; al editar queda "Fecha". */
function etiquetaDeLaFecha(nuevo: boolean, porPagar: boolean) {
  if (!nuevo) return 'Fecha';
  return porPagar ? 'Fecha en que vence' : 'Fecha de pago';
}

function atajosDe(hoy: string, porPagar: boolean, deCaja: boolean) {
  if (deCaja) return [];
  const otro = porPagar
    ? { texto: 'Mañana', fecha: sumarDias(hoy, 1) }
    : { texto: 'Ayer', fecha: sumarDias(hoy, -1) };
  return [{ texto: 'Hoy', fecha: hoy }, otro];
}

/** Las preguntas de la carga y la fecha: la del pago, o la del vencimiento si falta pagarlo. */
export function FechaYRepeticion({ control, errors, hoy, nuevo, deCaja }: Props) {
  const [fecha, seRepite, yaPagado] = useWatch({
    control,
    name: ['fecha', 'seRepite', 'yaPagado'],
  });
  const porPagar = quedaPorPagar({ seRepite, yaPagado });
  return (
    <>
      {nuevo ? <PreguntasDeCarga control={control} seRepite={seRepite} /> : null}
      <div className="space-y-2">
        <Controller
          control={control}
          name="fecha"
          render={({ field }) => (
            <CampoDeFecha
              id="fecha"
              etiqueta={etiquetaDeLaFecha(nuevo, porPagar)}
              valor={field.value}
              alCambiar={field.onChange}
              hasta={seRepite === 'no' && !porPagar ? hoy : undefined}
              atajos={atajosDe(hoy, porPagar, deCaja)}
              deshabilitado={deCaja}
              error={errors.fecha?.message}
            />
          )}
        />
        {nuevo && seRepite !== 'no' ? (
          <p className="text-xs text-muted-foreground">
            {resumenDeRepeticion(fecha, seRepite, hoy)}
          </p>
        ) : null}
      </div>
    </>
  );
}
