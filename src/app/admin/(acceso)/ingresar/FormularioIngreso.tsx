'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { BotonDeAcceso } from '@/components/formularios/Acceso';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
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
      <Campo
        id="email"
        etiqueta="Email"
        type="email"
        autoComplete="email"
        placeholder="tu@email.com"
        icono={Mail}
        variante="ingreso"
        error={errors.email?.message}
        {...register('email')}
      />
      <Campo
        id="contrasena"
        etiqueta="Contraseña"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        icono={Lock}
        variante="ingreso"
        error={errors.contrasena?.message}
        {...register('contrasena')}
      />
      {mensaje ? <AvisoDeError mensaje={mensaje} variante="caja" /> : null}
      <BotonDeAcceso enviando={isSubmitting}>Ingresar al sistema</BotonDeAcceso>
    </form>
  );
}
