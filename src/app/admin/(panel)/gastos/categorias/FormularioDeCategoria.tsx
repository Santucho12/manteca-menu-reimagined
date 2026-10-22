'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { Casilla } from '@/components/formularios/Casilla';
import { PieDelFormulario } from '@/components/formularios/PieDelFormulario';
import { BOTON_PRINCIPAL } from '@/components/panel/estilos';
import { conValorInicial } from '@/lib/formularios/valorInicial';
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
  const {
    register: registrar,
    handleSubmit,
    reset,
    formState,
  } = useForm<DatosDeCategoria>({
    resolver: zodResolver(esquemaCategoria),
    defaultValues: inicial,
  });
  const registro = conValorInicial(registrar, inicial);
  const guardar = (datos: DatosDeCategoria) =>
    id ? editarCategoriaDesdeElPanel({ ...datos, id }) : crearCategoriaDesdeElPanel(datos);
  const guardado = useGuardar(guardar, () => {
    if (id) router.push('/admin/gastos/categorias');
    else {
      reset(VACIA);
      router.refresh();
    }
  });
  return (
    <form onSubmit={handleSubmit(guardado.enviar)} noValidate className="space-y-5">
      <Campo
        id="nombre"
        etiqueta={id ? 'Nombre' : 'Nombre de la categoría nueva'}
        error={formState.errors.nombre?.message}
        {...registro('nombre')}
      />
      <Casilla id="pide-proveedor" etiqueta="Pide proveedor" {...registro('pideProveedor')} />
      {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
      {id ? (
        <PieDelFormulario enviando={guardado.enviando} cancelar="/admin/gastos/categorias" />
      ) : (
        <button type="submit" disabled={guardado.enviando} className={BOTON_PRINCIPAL}>
          <Plus size={14} aria-hidden="true" />
          Sumar
        </button>
      )}
    </form>
  );
}
