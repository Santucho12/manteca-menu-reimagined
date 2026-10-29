'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Store } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { ACCESO_SECUNDARIO, ICONO_DE_ACCESO_SUAVE } from '@/components/panel/estilos';
import { PieDelFormulario } from '@/components/formularios/PieDelFormulario';
import { conValorInicial } from '@/lib/formularios/valorInicial';
import { useGuardar } from '@/lib/gastos/useGuardar';
import { esquemaCanal } from '@/lib/ventas/esquemas';
import { crearCanalDesdeElPanel, editarCanalDesdeElPanel } from '../acciones';

type Datos = z.infer<typeof esquemaCanal>;

// El botón vive dentro del campo, a la derecha: escribir y sumar es un solo gesto.
const BOTON = `${ACCESO_SECUNDARIO} absolute right-1 top-1 h-9! flex-none pl-1.5`;

function BotonSumar({ enviando }: { enviando: boolean }) {
  return (
    <button type="submit" disabled={enviando} className={BOTON}>
      <span className={ICONO_DE_ACCESO_SUAVE}>
        <Plus size={15} strokeWidth={2.6} aria-hidden="true" />
      </span>
      Sumar
    </button>
  );
}

/** Sin id suma un canal y queda vacio para el siguiente; con id lo renombra. */
export function FormularioDeCanal({ id, inicial = '' }: { id?: string; inicial?: string }) {
  const router = useRouter();
  const valores = { nombre: inicial };
  const {
    register: registrar,
    handleSubmit,
    reset,
    formState,
  } = useForm<Datos>({ resolver: zodResolver(esquemaCanal), defaultValues: valores });
  const registro = conValorInicial(registrar, valores);
  const guardar = (datos: Datos) =>
    id ? editarCanalDesdeElPanel({ ...datos, id }) : crearCanalDesdeElPanel(datos);
  const guardado = useGuardar(guardar, () => {
    if (id) return router.push('/admin/ventas/canales');
    reset({ nombre: '' });
    router.refresh();
  });
  return (
    <form
      onSubmit={handleSubmit(guardado.enviar)}
      noValidate
      className={id ? 'space-y-5' : 'space-y-3'}
    >
      <div className={id ? undefined : 'relative'}>
        <div>
          <Campo
            id="nombre"
            etiqueta={id ? 'Nombre' : 'Nombre del tipo de venta nuevo'}
            {...(id
              ? {}
              : {
                  variante: 'ingreso',
                  icono: Store,
                  placeholder: 'Ej: Pedidos Ya, Mayorista, Encargos',
                })}
            error={formState.errors.nombre?.message}
            {...registro('nombre')}
          />
        </div>
        {id ? null : <BotonSumar enviando={guardado.enviando} />}
      </div>
      {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
      {id ? (
        <PieDelFormulario enviando={guardado.enviando} cancelar="/admin/ventas/canales" />
      ) : null}
    </form>
  );
}
