'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { Button } from '@/components/ui/button';
import { useGuardar } from '@/lib/gastos/useGuardar';
import { esquemaCanal } from '@/lib/ventas/esquemas';
import { crearCanalDesdeElPanel, editarCanalDesdeElPanel } from '../acciones';

type Datos = z.infer<typeof esquemaCanal>;

/** Sin id suma un canal y queda vacio para el siguiente; con id lo renombra. */
export function FormularioDeCanal({ id, inicial = '' }: { id?: string; inicial?: string }) {
  const router = useRouter();
  const { register, handleSubmit, reset, formState } = useForm<Datos>({
    resolver: zodResolver(esquemaCanal),
    defaultValues: { nombre: inicial },
  });
  const guardar = (datos: Datos) =>
    id ? editarCanalDesdeElPanel({ ...datos, id }) : crearCanalDesdeElPanel(datos);
  const guardado = useGuardar(guardar, () =>
    id ? router.push('/admin/ventas/canales') : reset({ nombre: '' }),
  );
  return (
    <form onSubmit={handleSubmit(guardado.enviar)} noValidate className="max-w-xl space-y-3">
      {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
      <Campo
        id="nombre"
        etiqueta={id ? 'Nombre' : 'Nombre del canal nuevo'}
        error={formState.errors.nombre?.message}
        {...register('nombre')}
      />
      <Button type="submit" disabled={guardado.enviando}>
        {id ? 'Guardar' : 'Sumar'}
      </Button>
    </form>
  );
}
