'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { CampoContrasena } from '@/components/formularios/CampoContrasena';
import { Button } from '@/components/ui/button';
import { useEnvio } from '@/lib/formularios/useEnvio';
import { esquemaIngreso } from '@/lib/usuarios/esquemas';
import { ingresarAlPanel } from './acciones';

export function FormularioIngreso() {
  const router = useRouter();
  const { mensaje, enviar } = useEnvio(ingresarAlPanel, () => router.replace('/admin'));
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(esquemaIngreso),
    defaultValues: { email: '', contrasena: '' },
  });
  const { errors, isSubmitting } = formState;
  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-4">
      {mensaje ? <AvisoDeError mensaje={mensaje} /> : null}
      <Campo
        id="email"
        etiqueta="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <CampoContrasena
        id="contrasena"
        etiqueta="Contraseña"
        autoComplete="current-password"
        error={errors.contrasena?.message}
        {...register('contrasena')}
      />
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Ingresando…' : 'Ingresar'}
      </Button>
    </form>
  );
}
