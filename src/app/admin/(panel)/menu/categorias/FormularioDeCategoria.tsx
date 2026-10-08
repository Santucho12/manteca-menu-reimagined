'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { Casilla } from '@/components/formularios/Casilla';
import { Button } from '@/components/ui/button';
import { esquemaCategoria, type DatosDeCategoria } from '@/lib/menu/esquemas';
import { useGuardado } from '@/lib/menu/useGuardado';
import { guardarCategoriaDelMenu } from '../acciones';
import { ConfirmacionDeOcultar } from '../ConfirmacionDeOcultar';
import { EditorDePresentaciones } from './EditorDePresentaciones';
import { SelectorDeIcono } from './SelectorDeIcono';
import { SubidaDeFoto } from './SubidaDeFoto';

type Props = { inicial: DatosDeCategoria; localId: string };

export function FormularioDeCategoria({ inicial, localId }: Props) {
  const router = useRouter();
  const formulario = useForm<DatosDeCategoria>({
    resolver: zodResolver(esquemaCategoria),
    defaultValues: inicial,
  });
  const guardado = useGuardado(guardarCategoriaDelMenu, () => router.push('/admin/menu'));
  const { register, handleSubmit, formState } = formulario;
  return (
    <FormProvider {...formulario}>
      <form onSubmit={handleSubmit(guardado.enviar)} noValidate className="max-w-xl space-y-5">
        {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
        <Campo
          id="nombre"
          etiqueta="Nombre"
          error={formState.errors.nombre?.message}
          {...register('nombre')}
        />
        <Campo
          id="subtitulo"
          etiqueta="Subtítulo"
          error={formState.errors.subtitulo?.message}
          {...register('subtitulo')}
        />
        <SelectorDeIcono />
        <SubidaDeFoto localId={localId} />
        <Casilla
          id="precio-compartido"
          etiqueta="Precio compartido"
          {...register('precioCompartido')}
        />
        <EditorDePresentaciones />
        {guardado.pendiente ? (
          <ConfirmacionDeOcultar
            productos={guardado.pendiente}
            alConfirmar={guardado.confirmar}
            alVolver={guardado.cancelar}
          />
        ) : (
          <Button type="submit" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? 'Guardando…' : 'Guardar'}
          </Button>
        )}
      </form>
    </FormProvider>
  );
}
