'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { Casilla } from '@/components/formularios/Casilla';
import { PieDelFormulario } from '@/components/formularios/PieDelFormulario';
import { conValorInicial } from '@/lib/formularios/valorInicial';
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
  const registro = conValorInicial(register, inicial);
  return (
    <FormProvider {...formulario}>
      <form onSubmit={handleSubmit(guardado.enviar)} noValidate className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo
            id="nombre"
            etiqueta="Nombre"
            error={formState.errors.nombre?.message}
            {...registro('nombre')}
          />
          <Campo
            id="subtitulo"
            etiqueta="Subtítulo"
            error={formState.errors.subtitulo?.message}
            {...registro('subtitulo')}
          />
        </div>
        <SelectorDeIcono />
        <SubidaDeFoto localId={localId} />
        <Casilla
          id="precio-compartido"
          etiqueta="Precio compartido"
          {...registro('precioCompartido')}
        />
        <EditorDePresentaciones />
        {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
        {guardado.pendiente ? (
          <ConfirmacionDeOcultar
            productos={guardado.pendiente}
            enviando={guardado.enviando}
            alConfirmar={guardado.confirmar}
            alVolver={guardado.cancelar}
          />
        ) : (
          <PieDelFormulario enviando={formState.isSubmitting} cancelar="/admin/menu" />
        )}
      </form>
    </FormProvider>
  );
}
