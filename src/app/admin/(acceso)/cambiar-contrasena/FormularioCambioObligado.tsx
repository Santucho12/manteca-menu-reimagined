'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { BotonDeAcceso } from '@/components/formularios/Acceso';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { CampoContrasena } from '@/components/formularios/CampoContrasena';
import { useEnvio } from '@/lib/formularios/useEnvio';
import { esquemaCambioObligado } from '@/lib/usuarios/esquemas';
import { guardarContrasenaNueva } from './acciones';

export function FormularioCambioObligado() {
  const router = useRouter();
  const { mensaje, enviar } = useEnvio(guardarContrasenaNueva, () => router.replace('/admin'));
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(esquemaCambioObligado),
    defaultValues: { nueva: '' },
  });
  const { errors, isSubmitting } = formState;
  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-4">
      <CampoContrasena
        id="nueva"
        etiqueta="Contraseña nueva"
        autoComplete="new-password"
        variante="ingreso"
        error={errors.nueva?.message}
        {...register('nueva')}
      />
      {mensaje ? <AvisoDeError mensaje={mensaje} variante="caja" /> : null}
      <BotonDeAcceso enviando={isSubmitting}>Guardar contraseña</BotonDeAcceso>
    </form>
  );
}
