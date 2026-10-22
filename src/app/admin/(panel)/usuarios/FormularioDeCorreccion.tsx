'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { PieDelFormulario } from '@/components/formularios/PieDelFormulario';
import { BOTON_CANCELAR } from '@/components/panel/estilos';
import { useEnvio } from '@/lib/formularios/useEnvio';
import { conValorInicial } from '@/lib/formularios/valorInicial';
import { esquemaCorreccion } from '@/lib/usuarios/esquemas';
import type { CuentaDeLaLista } from '@/lib/usuarios/pantalla';
import { corregirCuenta } from './acciones';

type Props = { cuenta: CuentaDeLaLista; alTerminar: () => void };

export function FormularioDeCorreccion({ cuenta, alTerminar }: Props) {
  const { mensaje, enviar } = useEnvio(corregirCuenta, alTerminar);
  const {
    register: registrar,
    handleSubmit,
    formState,
  } = useForm({ resolver: zodResolver(esquemaCorreccion), defaultValues: cuenta });
  const registro = conValorInicial(registrar, cuenta);
  const { errors, isSubmitting } = formState;
  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Campo
          id={`nombre-${cuenta.id}`}
          etiqueta="Nombre"
          error={errors.nombre?.message}
          {...registro('nombre')}
        />
        <Campo
          id={`email-${cuenta.id}`}
          etiqueta="Email"
          type="email"
          error={errors.email?.message}
          {...registro('email')}
        />
      </div>
      {mensaje ? <AvisoDeError mensaje={mensaje} /> : null}
      <PieDelFormulario
        enviando={isSubmitting}
        extra={
          <button type="button" onClick={alTerminar} className={`${BOTON_CANCELAR} flex-none px-6`}>
            Cancelar
          </button>
        }
      />
    </form>
  );
}
