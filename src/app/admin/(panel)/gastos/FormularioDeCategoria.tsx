'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Tags } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { Casilla } from '@/components/formularios/Casilla';
import {
  ACCESO_SECUNDARIO,
  BOTON_CANCELAR,
  BOTON_PRINCIPAL,
  ICONO_DE_ACCESO_SUAVE,
} from '@/components/panel/estilos';
import { conValorInicial } from '@/lib/formularios/valorInicial';
import { esquemaCategoria, type DatosDeCategoria } from '@/lib/gastos/esquemas';
import { useGuardar } from '@/lib/gastos/useGuardar';
import {
  crearCategoriaDesdeElPanel,
  editarCategoriaDesdeElPanel,
} from './acciones-de-configuracion';

const VACIA: DatosDeCategoria = { nombre: '', pideProveedor: false };

// Al sumar, el botón vive dentro del campo, a la derecha, como en Tipos de venta.
function BotonSumar({ enviando }: { enviando: boolean }) {
  return (
    <button
      type="submit"
      disabled={enviando}
      className={`${ACCESO_SECUNDARIO} absolute right-1 top-1 h-9! flex-none pl-1.5`}
    >
      <span className={ICONO_DE_ACCESO_SUAVE}>
        <Plus size={15} strokeWidth={2.6} aria-hidden="true" />
      </span>
      Sumar
    </button>
  );
}

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
  const campo = (
    <Campo
      id={`nombre-${sufijo}`}
      etiqueta={id ? 'Nombre' : 'Nombre de la categoría nueva'}
      error={formState.errors.nombre?.message}
      {...(id
        ? {}
        : {
            variante: 'ingreso',
            icono: Tags,
            placeholder: 'Ej: Limpieza, Packaging, Seguros',
            className: 'pr-36',
          })}
      {...registro('nombre')}
    />
  );
  return (
    <form onSubmit={handleSubmit(guardado.enviar)} noValidate className="space-y-3">
      <div className={id ? undefined : 'relative'}>
        {campo}
        {id ? null : <BotonSumar enviando={guardado.enviando} />}
      </div>
      <div className={id ? undefined : 'rounded-2xl bg-secondary/40 px-4 py-3'}>
        <Casilla
          id={`pide-proveedor-${sufijo}`}
          etiqueta="Pide proveedor"
          {...registro('pideProveedor')}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Al cargar un gasto de esta categoría se elige el proveedor.
        </p>
      </div>
      {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
      {id ? (
        <div className="flex gap-3">
          <button type="button" onClick={alTerminar} className={BOTON_CANCELAR}>
            Cancelar
          </button>
          <button type="submit" disabled={guardado.enviando} className={BOTON_PRINCIPAL}>
            Guardar
          </button>
        </div>
      ) : null}
    </form>
  );
}
