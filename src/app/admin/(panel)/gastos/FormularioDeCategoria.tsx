'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { Casilla } from '@/components/formularios/Casilla';
import { BOTON_CANCELAR, BOTON_PRINCIPAL } from '@/components/panel/estilos';
import { conValorInicial } from '@/lib/formularios/valorInicial';
import { esquemaCategoria, type DatosDeCategoria } from '@/lib/gastos/esquemas';
import { useGuardar } from '@/lib/gastos/useGuardar';
import {
  crearCategoriaDesdeElPanel,
  editarCategoriaDesdeElPanel,
} from './acciones-de-configuracion';

const VACIA: DatosDeCategoria = { nombre: '', pideProveedor: false };

type Props = { id?: string; inicial?: DatosDeCategoria; alTerminar?: () => void };

/** Sin id suma una categoría y queda vacío para la siguiente; con id la edita en su renglón. */
export function FormularioDeCategoria({ id, inicial = VACIA, alTerminar }: Props) {
  const router = useRouter();
  const sufijo = id ?? 'nueva';
  const { register, handleSubmit, reset, formState } = useForm<DatosDeCategoria>({
    resolver: zodResolver(esquemaCategoria),
    defaultValues: inicial,
  });
  const registro = conValorInicial(register, inicial);
  const guardar = (datos: DatosDeCategoria) =>
    id ? editarCategoriaDesdeElPanel({ ...datos, id }) : crearCategoriaDesdeElPanel(datos);
  const guardado = useGuardar(guardar, () => {
    toast.success(id ? 'Categoría guardada' : 'Categoría sumada');
    if (!id) reset(VACIA);
    alTerminar?.();
    router.refresh();
  });
  return (
    <form onSubmit={handleSubmit(guardado.enviar)} noValidate className="space-y-3">
      <Campo
        id={`nombre-${sufijo}`}
        etiqueta={id ? 'Nombre' : 'Nombre de la categoría nueva'}
        error={formState.errors.nombre?.message}
        {...registro('nombre')}
      />
      <Casilla
        id={`pide-proveedor-${sufijo}`}
        etiqueta="Pide proveedor"
        {...registro('pideProveedor')}
      />
      <p className="text-[11px] text-muted-foreground">
        Al cargar un gasto de esta categoría se elige el proveedor.
      </p>
      {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
      <div className="flex gap-3">
        {id ? (
          <button type="button" onClick={alTerminar} className={BOTON_CANCELAR}>
            Cancelar
          </button>
        ) : null}
        <button type="submit" disabled={guardado.enviando} className={BOTON_PRINCIPAL}>
          {id ? null : <Plus size={14} aria-hidden="true" />}
          {id ? 'Guardar' : 'Sumar'}
        </button>
      </div>
    </form>
  );
}
