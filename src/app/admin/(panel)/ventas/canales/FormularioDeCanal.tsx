'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { PieDelFormulario } from '@/components/formularios/PieDelFormulario';
import { BOTON_PRINCIPAL } from '@/components/panel/estilos';
import { conValorInicial } from '@/lib/formularios/valorInicial';
import { useGuardar } from '@/lib/gastos/useGuardar';
import { esquemaCanal } from '@/lib/ventas/esquemas';
import { crearCanalDesdeElPanel, editarCanalDesdeElPanel } from '../acciones';

type Datos = z.infer<typeof esquemaCanal>;

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
    <form onSubmit={handleSubmit(guardado.enviar)} noValidate className="space-y-5">
      <Campo
        id="nombre"
        etiqueta={id ? 'Nombre' : 'Nombre del canal nuevo'}
        error={formState.errors.nombre?.message}
        {...registro('nombre')}
      />
      {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
      {id ? (
        <PieDelFormulario enviando={guardado.enviando} cancelar="/admin/ventas/canales" />
      ) : (
        <button type="submit" disabled={guardado.enviando} className={BOTON_PRINCIPAL}>
          <Plus size={14} aria-hidden="true" />
          Sumar
        </button>
      )}
    </form>
  );
}
