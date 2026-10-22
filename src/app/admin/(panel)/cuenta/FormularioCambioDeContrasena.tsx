'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { AvisoDeExito } from '@/components/formularios/AvisoDeExito';
import { CampoContrasena } from '@/components/formularios/CampoContrasena';
import { BOTON_PRINCIPAL } from '@/components/panel/estilos';
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
    <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-5">
      {listo ? <AvisoDeExito titulo="Listo, cambiaste tu contraseña." /> : null}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>
      {mensaje ? <AvisoDeError mensaje={mensaje} /> : null}
      <button type="submit" disabled={isSubmitting} className={BOTON_PRINCIPAL}>
        <Save size={14} />
        {isSubmitting ? 'Guardando...' : 'Cambiar contraseña'}
      </button>
    </form>
  );
}
