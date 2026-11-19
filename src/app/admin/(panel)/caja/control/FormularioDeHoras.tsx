'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { AvisoDeExito } from '@/components/formularios/AvisoDeExito';
import { Campo } from '@/components/formularios/Campo';
import { BOTON_PRINCIPAL } from '@/components/panel/estilos';
import { esquemaDeHoras, type HorasDeCierre } from '@/lib/caja/turnos';
import { conValorInicial } from '@/lib/formularios/valorInicial';
import { useGuardar } from '@/lib/gastos/useGuardar';
import { cambiarHorasDesdeElPanel } from '../acciones';

/** A qué hora se traba el mostrador hasta cargar el cierre de cada turno. */
export function FormularioDeHoras({ inicial }: { inicial: HorasDeCierre }) {
  const [guardadas, setGuardadas] = useState(false);
  const guardado = useGuardar(cambiarHorasDesdeElPanel, () => setGuardadas(true));
  const { register, handleSubmit, formState } = useForm<HorasDeCierre>({
    resolver: zodResolver(esquemaDeHoras),
    defaultValues: inicial,
  });
  const registro = conValorInicial(register, inicial);
  const guardar = (datos: HorasDeCierre) => {
    setGuardadas(false);
    return guardado.enviar(datos);
  };
  const { errors } = formState;
  return (
    <form onSubmit={handleSubmit(guardar)} noValidate className="space-y-5">
      {guardadas ? <AvisoDeExito titulo="Horas guardadas." /> : null}
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
      <button type="submit" disabled={guardado.enviando} className={BOTON_PRINCIPAL}>
        <Save size={14} aria-hidden="true" />
        Guardar horas
      </button>
      {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
      <p className="text-xs text-muted-foreground">
        A esa hora, Vender se traba hasta cargar el cierre del turno. Se puede postergar de a 10
        minutos.
      </p>
    </form>
  );
}
