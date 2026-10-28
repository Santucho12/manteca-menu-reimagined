'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { CampoDeFecha } from '@/components/formularios/CampoDeFecha';
import { CampoDeSeleccion } from '@/components/formularios/CampoDeSeleccion';
import { BOTON_CANCELAR, BOTON_DE_FILA_SUAVE, BOTON_ESMERALDA } from '@/components/panel/estilos';
import { Ventana } from '@/components/panel/Ventana';
import { esquemaPago, type DatosDePago } from '@/lib/gastos/esquemas';
import { opcionesDeMedio } from '@/lib/gastos/pantalla';
import { pagoInicial, type ItemPorPagar } from '@/lib/gastos/porPagar';
import { useGuardar } from '@/lib/gastos/useGuardar';
import { sumarDias } from '@/lib/reportes/periodos';
import { cn } from '@/lib/utils';
import { pagarDesdeElPanel } from './acciones';

type Props = { item: ItemPorPagar; hoy: string };
type PropsDelBoton = Props & { abierta?: boolean };

function FormularioDePago({ item, hoy, cerrar }: Props & { cerrar: () => void }) {
  const router = useRouter();
  // Una clave por ventana abierta: un toque repetido no anota dos pagos.
  const [clave] = useState(() => crypto.randomUUID());
  const guardado = useGuardar(pagarDesdeElPanel, () => {
    cerrar();
    toast.success('Pago anotado');
    router.refresh();
  });
  const { register, handleSubmit, control, formState } = useForm<DatosDePago>({
    resolver: zodResolver(esquemaPago(hoy)),
    defaultValues: pagoInicial(item, hoy, clave),
  });
  const { errors } = formState;
  const atajos = [
    { texto: 'Hoy', fecha: hoy },
    { texto: 'Ayer', fecha: sumarDias(hoy, -1) },
  ];
  return (
    <form onSubmit={handleSubmit(guardado.enviar)} noValidate className="space-y-5">
      {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
      <Controller
        control={control}
        name="fecha"
        render={({ field }) => (
          <CampoDeFecha
            id="fecha-del-pago"
            etiqueta="Fecha del pago"
            valor={field.value}
            alCambiar={field.onChange}
            hasta={hoy}
            atajos={atajos}
            error={errors.fecha?.message}
          />
        )}
      />
      <Campo
        id="monto-del-pago"
        etiqueta="Monto"
        inputMode="decimal"
        error={errors.monto?.message}
        {...register('monto')}
      />
      <CampoDeSeleccion
        id="medio-del-pago"
        etiqueta="Medio de pago"
        opciones={[{ valor: '', texto: 'Elegí cómo se pagó' }, ...opcionesDeMedio()]}
        error={errors.medioDePago?.message}
        {...register('medioDePago')}
      />
      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <button type="button" onClick={cerrar} className={BOTON_CANCELAR}>
          Cancelar
        </button>
        <button
          type="submit"
          disabled={guardado.enviando}
          className={`flex-[2] ${BOTON_ESMERALDA}`}
        >
          Anotar el pago
        </button>
      </div>
    </form>
  );
}

/** Pagado: una ventana con la fecha, el monto y el medio ya completos, para confirmar o corregir. */
export function BotonDePago({ item, hoy, abierta: alInicio = false }: PropsDelBoton) {
  const [abierta, setAbierta] = useState(alInicio);
  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        className={cn(BOTON_DE_FILA_SUAVE, 'h-7 px-2 text-[10px]')}
      >
        <Check size={13} aria-hidden="true" />
        Pagado
      </button>
      <Ventana abierta={abierta} cerrar={() => setAbierta(false)} titulo={`Pagado: ${item.nombre}`}>
        <FormularioDePago item={item} hoy={hoy} cerrar={() => setAbierta(false)} />
      </Ventana>
    </>
  );
}
