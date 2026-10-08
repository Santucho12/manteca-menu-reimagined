'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { CampoContrasena } from '@/components/formularios/CampoContrasena';
import { Button } from '@/components/ui/button';
import { useEnvio } from '@/lib/formularios/useEnvio';
import { esquemaRegistro } from '@/lib/usuarios/esquemas';
import { registrarse } from './acciones';

export function FormularioRegistro() {
  const router = useRouter();
  const { mensaje, enviar } = useEnvio(registrarse, () => router.replace('/admin'));
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(esquemaRegistro),
    defaultValues: { nombre: '', email: '', contrasena: '' },
  });
  const { errors, isSubmitting } = formState;
  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-4">
      {mensaje ? <AvisoDeError mensaje={mensaje} /> : null}
      <Campo
        id="nombre"
        etiqueta="Nombre"
        autoComplete="name"
        error={errors.nombre?.message}
        {...register('nombre')}
      />
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
        autoComplete="new-password"
        error={errors.contrasena?.message}
        {...register('contrasena')}
      />
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Creando la cuenta…' : 'Registrarme'}
      </Button>
    </form>
  );
}
