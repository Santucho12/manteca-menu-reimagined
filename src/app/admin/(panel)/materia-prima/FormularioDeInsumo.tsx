'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { CampoDeSeleccion } from '@/components/formularios/CampoDeSeleccion';
import { CampoDeTextoLargo } from '@/components/formularios/CampoDeTextoLargo';
import { PieDelFormulario } from '@/components/formularios/PieDelFormulario';
import { BOTON_CANCELAR, BOTON_PRINCIPAL } from '@/components/panel/estilos';
import { conValorInicial } from '@/lib/formularios/valorInicial';
import { esquemaInsumo, type DatosDeInsumo } from '@/lib/materia-prima/esquemas';
import { OPCIONES_DE_UNIDAD } from '@/lib/materia-prima/pantalla';
import { useGuardarProveedor } from '@/lib/proveedores/useGuardarProveedor';
import { crearInsumoDesdeElPanel, editarInsumoDesdeElPanel } from './acciones';

type Props = { inicial: DatosDeInsumo; id?: string };
type PropsDelAviso = {
  nombre: string;
  enviando: boolean;
  alConfirmar: () => void;
  alVolver: () => void;
};

/** El nombre ya existe: se pregunta antes de cargarlo igual. */
function Repetido({ nombre, enviando, alConfirmar, alVolver }: PropsDelAviso) {
  return (
    <div
      role="alertdialog"
      aria-labelledby="repetido"
      className="space-y-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
        <p id="repetido" className="text-sm font-semibold">
          Ya hay un insumo llamado {nombre}. ¿Lo cargás igual?
        </p>
      </div>
      <div className="flex flex-col-reverse gap-3 max-sm:[&>*]:flex-none sm:flex-row">
        <button type="button" onClick={alVolver} className={BOTON_CANCELAR}>
          Volver
        </button>
        <button type="button" disabled={enviando} onClick={alConfirmar} className={BOTON_PRINCIPAL}>
          Cargar igual
        </button>
      </div>
    </div>
  );
}

export function FormularioDeInsumo({ inicial, id }: Props) {
  const router = useRouter();
  const guardar = (datos: DatosDeInsumo, confirmar: boolean) =>
    id
      ? editarInsumoDesdeElPanel({ ...datos, id })
      : crearInsumoDesdeElPanel({ ...datos, confirmar });
  const guardado = useGuardarProveedor(guardar, (nuevo) =>
    router.push(`/admin/materia-prima/${nuevo}`),
  );
  const { register, handleSubmit, formState } = useForm<DatosDeInsumo>({
    resolver: zodResolver(esquemaInsumo),
    defaultValues: inicial,
  });
  const errors = formState.errors;
  const registro = conValorInicial(register, inicial);
  return (
    <form onSubmit={handleSubmit(guardado.enviar)} noValidate className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Campo
          id="nombre"
          etiqueta="Nombre"
          error={errors.nombre?.message}
          {...registro('nombre')}
        />
        <CampoDeSeleccion
          id="unidad"
          etiqueta="En qué se mide"
          opciones={OPCIONES_DE_UNIDAD}
          error={errors.unidad?.message}
          {...registro('unidad')}
        />
      </div>
      <CampoDeTextoLargo
        id="observaciones"
        etiqueta="Observaciones"
        error={errors.observaciones?.message}
        {...registro('observaciones')}
      />
      {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
      {guardado.repetido ? (
        <Repetido
          nombre={guardado.repetido.nombre}
          enviando={guardado.enviando}
          alConfirmar={handleSubmit(guardado.confirmar)}
          alVolver={guardado.volver}
        />
      ) : (
        <PieDelFormulario enviando={guardado.enviando} cancelar="/admin/materia-prima" />
      )}
    </form>
  );
}
