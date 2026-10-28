'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { BotonDeAcceso } from '@/components/formularios/Acceso';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { CampoContrasena } from '@/components/formularios/CampoContrasena';
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
    <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-3">
      <Campo
        id="nombre"
        etiqueta="Nombre"
        autoComplete="name"
        icono={User}
        placeholder="Tu nombre"
        variante="ingreso"
        error={errors.nombre?.message}
        {...register('nombre')}
      />
      <Campo
        id="email"
        etiqueta="Email"
        type="email"
        autoComplete="email"
        placeholder="email@ejemplo.com"
        icono={Mail}
        variante="ingreso"
        error={errors.email?.message}
        {...register('email')}
      />
      <CampoContrasena
        id="contrasena"
        etiqueta="Contraseña"
        autoComplete="new-password"
        placeholder="Contraseña"
        variante="ingreso"
        error={errors.contrasena?.message}
        {...register('contrasena')}
      />
      {mensaje ? <AvisoDeError mensaje={mensaje} variante="caja" /> : null}
      <BotonDeAcceso enviando={isSubmitting}>Crear cuenta</BotonDeAcceso>
    </form>
  );
}
