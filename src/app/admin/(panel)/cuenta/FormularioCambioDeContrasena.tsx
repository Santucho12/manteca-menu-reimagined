'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { AvisoDeExito } from '@/components/formularios/AvisoDeExito';
import { CampoContrasena } from '@/components/formularios/CampoContrasena';
import { Button } from '@/components/ui/button';
import { useEnvio } from '@/lib/formularios/useEnvio';
import { esquemaCambioDeContrasena } from '@/lib/usuarios/esquemas';
import { cambiarMiContrasena } from './acciones';

export function FormularioCambioDeContrasena() {
  const { register, handleSubmit, formState, reset } = useForm({
    resolver: zodResolver(esquemaCambioDeContrasena),
    defaultValues: { actual: '', nueva: '' },
  });
  const { mensaje, listo, enviar } = useEnvio(cambiarMiContrasena, () => reset());
  const { errors, isSubmitting } = formState;
  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-4">
      {mensaje ? <AvisoDeError mensaje={mensaje} /> : null}
      {listo ? <AvisoDeExito mensaje="Listo, cambiaste tu contraseña." /> : null}
      <CampoContrasena
        id="actual"
        etiqueta="Contraseña actual"
        autoComplete="current-password"
        error={errors.actual?.message}
        {...register('actual')}
      />
      <CampoContrasena
        id="nueva"
        etiqueta="Contraseña nueva"
        autoComplete="new-password"
        error={errors.nueva?.message}
        {...register('nueva')}
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Cambiando…' : 'Cambiar contraseña'}
      </Button>
    </form>
  );
}
