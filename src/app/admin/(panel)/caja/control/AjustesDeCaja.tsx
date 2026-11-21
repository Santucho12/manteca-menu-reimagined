'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Clock, Save, Scale, Settings } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { ACCESO_SECUNDARIO, ICONO_DE_ACCESO_SUAVE } from '@/components/panel/estilos';
import { Ventana } from '@/components/panel/Ventana';
import { esquemaDeAjustes, type AjustesDeCaja as Ajustes } from '@/lib/caja/ajustes';
import { conValorInicial } from '@/lib/formularios/valorInicial';
import { useGuardar } from '@/lib/gastos/useGuardar';
import { Bloque } from '../Piezas';
import { guardarAjustes } from './guardarAjustes';

function FormularioDeAjustes({ inicial }: { inicial: Ajustes }) {
  const [guardados, setGuardados] = useState(false);
  const guardado = useGuardar(guardarAjustes, () => setGuardados(true));
  const { register, handleSubmit, formState } = useForm<Ajustes>({
    resolver: zodResolver(esquemaDeAjustes),
    defaultValues: inicial,
  });
  const registro = conValorInicial(register, inicial);
  const { errors } = formState;
  const guardar = (datos: Ajustes) => {
    setGuardados(false);
    return guardado.enviar(datos);
  };
  return (
    <form onSubmit={handleSubmit(guardar)} noValidate className="space-y-4">
      <Bloque
        titulo="Horas de cierre"
        ayuda="A esa hora, Vender se traba hasta cargar el cierre del turno. Se puede postergar de a 10 minutos."
        icono={Clock}
        tono="violeta"
      >
        <div className="grid grid-cols-2 gap-3">
          <Campo
            id="hora-mediodia"
            etiqueta="Cierre del mediodía"
            type="time"
            error={errors.mediodia?.message}
            {...registro('mediodia')}
          />
          <Campo
            id="hora-noche"
            etiqueta="Cierre de la noche"
            type="time"
            error={errors.noche?.message}
            {...registro('noche')}
          />
        </div>
      </Bloque>
      <Bloque
        titulo="Diferencia aceptada"
        ayuda="Una diferencia menor, por medio de pago, figura como “cierra”."
        icono={Scale}
        tono="naranja"
      >
        <Campo
          id="tolerancia"
          etiqueta="Tolerancia en pesos"
          inputMode="decimal"
          error={errors.tolerancia?.message}
          {...registro('tolerancia')}
        />
      </Bloque>
      {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
      <button
        type="submit"
        disabled={guardado.enviando}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
      >
        <Save size={16} aria-hidden="true" />
        {guardado.enviando ? 'Guardando...' : 'Guardar ajustes'}
      </button>
      {guardados ? (
        <p
          role="status"
          className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700"
        >
          <CheckCircle2 size={14} aria-hidden="true" /> Ajustes guardados.
        </p>
      ) : null}
    </form>
  );
}

/** Lo que casi no se toca, detrás de un botón: horas de cierre y diferencia aceptada. */
export function AjustesDeCaja({ inicial }: { inicial: Ajustes }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setAbierta(true)} className={ACCESO_SECUNDARIO}>
        <span className={ICONO_DE_ACCESO_SUAVE}>
          <Settings size={15} aria-hidden="true" />
        </span>
        Ajustes de caja
      </button>
      <Ventana
        abierta={abierta}
        cerrar={() => setAbierta(false)}
        titulo="Ajustes de caja"
        ancho="max-w-lg"
      >
        <FormularioDeAjustes inicial={inicial} />
      </Ventana>
    </>
  );
}
