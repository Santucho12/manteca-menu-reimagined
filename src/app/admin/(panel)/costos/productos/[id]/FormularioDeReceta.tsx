'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useFieldArray, useForm, type UseFormReturn } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { AvisoDeExito } from '@/components/formularios/AvisoDeExito';
import { Campo } from '@/components/formularios/Campo';
import { CampoDeSeleccion } from '@/components/formularios/CampoDeSeleccion';
import { PieDelFormulario } from '@/components/formularios/PieDelFormulario';
import { BOTON_SUAVE, ICONO_EDITAR } from '@/components/panel/estilos';
import { buscarInsumos } from '@/lib/costos/buscarInsumos';
import type { InsumoParaReceta } from '@/lib/costos/consultas';
import { esquemaReceta, type DatosDeReceta } from '@/lib/costos/esquemas';
import { useGuardarConAviso } from '@/lib/costos/useGuardarConAviso';
import { guardarRecetaDesdeElPanel } from '../../acciones';

type Props = { inicial: DatosDeReceta; insumos: InsumoParaReceta[]; desactivados: string[] };
type Formulario = UseFormReturn<DatosDeReceta>;

const opcionesDe = (insumos: InsumoParaReceta[]) => [
  { valor: '', texto: 'Elegí un insumo' },
  ...insumos.map((i) => ({ valor: i.id, texto: `${i.nombre} (${i.unidad})` })),
];

function Renglon({
  formulario,
  indice,
  insumos,
  quitar,
  desactivado,
}: {
  formulario: Formulario;
  indice: number;
  insumos: InsumoParaReceta[];
  quitar: () => void;
  desactivado: boolean;
}) {
  const errores = formulario.formState.errors.renglones?.[indice];
  return (
    <div className="grid grid-cols-[1fr_8rem_auto] items-end gap-3">
      <CampoDeSeleccion
        id={`insumo-${indice}`}
        etiqueta={`Insumo ${indice + 1}`}
        opciones={opcionesDe(insumos)}
        error={errores?.insumoId?.message}
        {...formulario.register(`renglones.${indice}.insumoId`)}
      />
      <Campo
        id={`cantidad-${indice}`}
        etiqueta={`Cantidad ${indice + 1}`}
        inputMode="decimal"
        error={errores?.cantidad?.message}
        {...formulario.register(`renglones.${indice}.cantidad`)}
      />
      <button
        type="button"
        onClick={quitar}
        aria-label={`Quitar insumo ${indice + 1}`}
        className={ICONO_EDITAR}
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
      {desactivado ? (
        <p className="text-xs font-semibold text-blue-700 sm:col-span-3">
          Desactivado en Materia prima: la receta lo sigue usando.
        </p>
      ) : null}
    </div>
  );
}

/** Los insumos de la receta con su cantidad, cuanto rinde y el desperdicio. */
export function FormularioDeReceta({ inicial, insumos, desactivados }: Props) {
  const formulario = useForm<DatosDeReceta>({
    resolver: zodResolver(esquemaReceta),
    defaultValues: inicial,
  });
  const renglones = useFieldArray({ control: formulario.control, name: 'renglones' });
  const guardado = useGuardarConAviso(guardarRecetaDesdeElPanel, 'Guardamos la receta.');
  const errores = formulario.formState.errors;
  const [busqueda, setBusqueda] = useState('');
  const elegidos = formulario.watch('renglones').map((r) => r.insumoId);
  const apagado = (indice: number) => desactivados.includes(elegidos[indice] ?? '');
  const ofrecidos = buscarInsumos(insumos, busqueda, elegidos);
  return (
    <form onSubmit={formulario.handleSubmit(guardado.enviar)} noValidate className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Campo
          id="rinde"
          etiqueta="Rinde"
          inputMode="decimal"
          error={errores.rinde?.message}
          {...formulario.register('rinde')}
        />
        <Campo
          id="desperdicio"
          etiqueta="Desperdicio (%)"
          inputMode="decimal"
          error={errores.desperdicio?.message}
          {...formulario.register('desperdicio')}
        />
      </div>
      <Campo
        id="buscar-insumo"
        etiqueta="Buscar insumo"
        value={busqueda}
        onChange={(evento) => setBusqueda(evento.target.value)}
      />
      {renglones.fields.map((campo, indice) => (
        <Renglon
          key={campo.id}
          formulario={formulario}
          indice={indice}
          insumos={ofrecidos}
          quitar={() => renglones.remove(indice)}
          desactivado={apagado(indice)}
        />
      ))}
      {errores.renglones?.message ? <AvisoDeError mensaje={errores.renglones.message} /> : null}
      <button
        type="button"
        onClick={() => renglones.append({ insumoId: '', cantidad: '' })}
        className={BOTON_SUAVE}
      >
        <Plus size={14} aria-hidden="true" /> Agregar insumo
      </button>
      {guardado.error ? <AvisoDeError mensaje={guardado.error} /> : null}
      {guardado.listo ? <AvisoDeExito titulo={guardado.listo} /> : null}
      <PieDelFormulario enviando={guardado.enviando} cancelar="/admin/costos" />
    </form>
  );
}
