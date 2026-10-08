'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { CampoDeSeleccion } from '@/components/formularios/CampoDeSeleccion';
import { CampoDeTextoLargo } from '@/components/formularios/CampoDeTextoLargo';
import { Casilla } from '@/components/formularios/Casilla';
import { Button } from '@/components/ui/button';
import { esquemaProducto, type DatosDeProducto } from '@/lib/menu/esquemas';
import { useGuardado } from '@/lib/menu/useGuardado';
import {
  usePreciosSegunCategoria,
  type OpcionDeCategoria,
} from '@/lib/menu/usePreciosSegunCategoria';
import { guardarProductoDelMenu } from '../acciones';
import { ConfirmacionDeOcultar } from '../ConfirmacionDeOcultar';
import { PreciosDelFormulario } from './PreciosDelFormulario';

const ETIQUETAS = [
  { valor: '', texto: 'Sin etiqueta' },
  { valor: 'mas_vendido', texto: 'Más vendido' },
  { valor: 'artesanal', texto: 'Artesanal' },
  { valor: 'nuevo', texto: 'Nuevo' },
];

type Props = { inicial: DatosDeProducto; opciones: OpcionDeCategoria[] };

function CamposDelProducto({ opciones }: { opciones: OpcionDeCategoria[] }) {
  const categoria = usePreciosSegunCategoria(opciones);
  return <PreciosDelFormulario categoria={categoria} />;
}

export function FormularioDeProducto({ inicial, opciones }: Props) {
  const router = useRouter();
  const formulario = useForm<DatosDeProducto>({
    resolver: zodResolver(esquemaProducto),
    defaultValues: inicial,
  });
  const guardado = useGuardado(guardarProductoDelMenu, () => router.push('/admin/menu'));
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = formulario;
  const categorias = [
    { valor: '', texto: 'Elegí una categoría' },
    ...opciones.map((o) => ({ valor: o.id, texto: o.nombre })),
  ];
  return (
    <FormProvider {...formulario}>
      <form onSubmit={handleSubmit(guardado.enviar)} noValidate className="max-w-xl space-y-5">
        {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
        <CampoDeSeleccion
          id="categoria"
          etiqueta="Categoría"
          opciones={categorias}
          error={errors.categoriaId?.message}
          {...register('categoriaId')}
        />
        <Campo
          id="nombre"
          etiqueta="Nombre"
          error={errors.nombre?.message}
          {...register('nombre')}
        />
        <CampoDeTextoLargo
          id="descripcion"
          etiqueta="Descripción"
          error={errors.descripcion?.message}
          {...register('descripcion')}
        />
        <CampoDeSeleccion
          id="etiqueta"
          etiqueta="Etiqueta"
          opciones={ETIQUETAS}
          {...register('etiqueta')}
        />
        <CamposDelProducto opciones={opciones} />
        <Casilla id="visible" etiqueta="Se muestra en el menú" {...register('visible')} />
        {guardado.pendiente ? (
          <ConfirmacionDeOcultar
            productos={guardado.pendiente}
            enviando={guardado.enviando}
            alConfirmar={guardado.confirmar}
            alVolver={guardado.cancelar}
          />
        ) : (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : 'Guardar'}
          </Button>
        )}
      </form>
    </FormProvider>
  );
}
