'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { AvisoDeExito } from '@/components/formularios/AvisoDeExito';
import { Campo } from '@/components/formularios/Campo';
import { PieDelFormulario } from '@/components/formularios/PieDelFormulario';
import { BOTON_PRINCIPAL } from '@/components/panel/estilos';
import {
  esquemaMargenes,
  esquemaUnidades,
  type DatosDeMargenes,
  type DatosDeUnidades,
} from '@/lib/costos/esquemas';
import { useGuardarConAviso } from '@/lib/costos/useGuardarConAviso';
import { guardarMargenesDesdeElPanel, guardarUnidadesDesdeElPanel } from '../acciones';

/** El margen objetivo da el precio sugerido; debajo del minimo, el producto avisa. */
export function FormularioDeMargenes({ inicial }: { inicial: DatosDeMargenes }) {
  const { register, handleSubmit, formState } = useForm<DatosDeMargenes>({
    resolver: zodResolver(esquemaMargenes),
    defaultValues: inicial,
  });
  const guardado = useGuardarConAviso(guardarMargenesDesdeElPanel, 'Guardamos los márgenes.');
  const errores = formState.errors;
  return (
    <form onSubmit={handleSubmit(guardado.enviar)} noValidate className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Campo
          id="objetivo"
          etiqueta="Margen objetivo"
          type="number"
          error={errores.objetivo?.message}
          {...register('objetivo', { valueAsNumber: true })}
        />
        <Campo
          id="minimo"
          etiqueta="Margen mínimo"
          type="number"
          error={errores.minimo?.message}
          {...register('minimo', { valueAsNumber: true })}
        />
      </div>
      {guardado.error ? <AvisoDeError mensaje={guardado.error} /> : null}
      {guardado.listo ? <AvisoDeExito titulo={guardado.listo} /> : null}
      <PieDelFormulario enviando={guardado.enviando} texto="Guardar márgenes" />
    </form>
  );
}

type PropsDeUnidades = { presentacionId: string; nombre: string; inicial: DatosDeUnidades };

/** Cuantas unidades lleva una presentacion y el monto fijo que se le suma. */
export function FormularioDeUnidades({ presentacionId, nombre, inicial }: PropsDeUnidades) {
  const { register, handleSubmit, formState } = useForm<DatosDeUnidades>({
    resolver: zodResolver(esquemaUnidades),
    defaultValues: inicial,
  });
  const guardar = (datos: DatosDeUnidades) =>
    guardarUnidadesDesdeElPanel({ ...datos, presentacionId });
  const guardado = useGuardarConAviso(guardar, 'Guardado.');
  const errores = formState.errors;
  return (
    <fieldset aria-label={nombre} className="rounded-xl bg-secondary/40 p-3 space-y-3">
      <legend className="text-sm font-semibold">{nombre.split(' · ')[1]}</legend>
      <form
        onSubmit={handleSubmit(guardado.enviar)}
        noValidate
        className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] items-end gap-3"
      >
        <Campo
          id={`unidades-${presentacionId}`}
          etiqueta="Unidades"
          inputMode="decimal"
          error={errores.unidades?.message}
          {...register('unidades')}
        />
        <Campo
          id={`agregado-${presentacionId}`}
          etiqueta="Agregado"
          inputMode="decimal"
          error={errores.agregado?.message}
          {...register('agregado')}
        />
        <button type="submit" disabled={guardado.enviando} className={BOTON_PRINCIPAL}>
          Guardar
        </button>
      </form>
      {guardado.error ? <AvisoDeError mensaje={guardado.error} /> : null}
      {guardado.listo ? (
        <p className="text-xs font-semibold text-emerald-700">{guardado.listo}</p>
      ) : null}
    </fieldset>
  );
}
