'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { Casilla } from '@/components/formularios/Casilla';
import { Button } from '@/components/ui/button';
import { esquemaCategoria, type DatosDeCategoria } from '@/lib/gastos/esquemas';
import { useGuardar } from '@/lib/gastos/useGuardar';
import {
  crearCategoriaDesdeElPanel,
  editarCategoriaDesdeElPanel,
} from '../acciones-de-configuracion';

const VACIA: DatosDeCategoria = { nombre: '', pideProveedor: false };

/** Sin id suma una categoria y queda vacio para la siguiente; con id la edita. */
export function FormularioDeCategoria({
  id,
  inicial = VACIA,
}: {
  id?: string;
  inicial?: DatosDeCategoria;
}) {
  const router = useRouter();
  const { register, handleSubmit, reset, formState } = useForm<DatosDeCategoria>({
    resolver: zodResolver(esquemaCategoria),
    defaultValues: inicial,
  });
  const guardar = (datos: DatosDeCategoria) =>
    id ? editarCategoriaDesdeElPanel({ ...datos, id }) : crearCategoriaDesdeElPanel(datos);
  const guardado = useGuardar(guardar, () =>
    id ? router.push('/admin/gastos/categorias') : reset(VACIA),
  );
  return (
    <form onSubmit={handleSubmit(guardado.enviar)} noValidate className="max-w-xl space-y-3">
      {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
      <Campo
        id="nombre"
        etiqueta={id ? 'Nombre' : 'Nombre de la categoría nueva'}
        error={formState.errors.nombre?.message}
        {...register('nombre')}
      />
      <Casilla id="pide-proveedor" etiqueta="Pide proveedor" {...register('pideProveedor')} />
      <Button type="submit" disabled={guardado.enviando}>
        {id ? 'Guardar' : 'Sumar'}
      </Button>
    </form>
  );
}
