'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { Button } from '@/components/ui/button';
import { useEnvio } from '@/lib/formularios/useEnvio';
import { esquemaCorreccion } from '@/lib/usuarios/esquemas';
import type { CuentaDeLaLista } from '@/lib/usuarios/pantalla';
import { corregirCuenta } from './acciones';

type Props = { cuenta: CuentaDeLaLista; alTerminar: () => void };

export function FormularioDeCorreccion({ cuenta, alTerminar }: Props) {
  const { mensaje, enviar } = useEnvio(corregirCuenta, alTerminar);
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(esquemaCorreccion),
    defaultValues: cuenta,
  });
  const { errors, isSubmitting } = formState;
  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-3">
      {mensaje ? <AvisoDeError mensaje={mensaje} /> : null}
      <Campo
        id={`nombre-${cuenta.id}`}
        etiqueta="Nombre"
        error={errors.nombre?.message}
        {...register('nombre')}
      />
      <Campo
        id={`email-${cuenta.id}`}
        etiqueta="Email"
        type="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : 'Guardar'}
        </Button>
        <Button type="button" variant="outline" onClick={alTerminar}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
