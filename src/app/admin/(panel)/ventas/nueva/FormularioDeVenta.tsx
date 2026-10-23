'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm, useWatch, type Control } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { CampoDeSeleccion } from '@/components/formularios/CampoDeSeleccion';
import { CampoDeTextoLargo } from '@/components/formularios/CampoDeTextoLargo';
import { PieDelFormulario } from '@/components/formularios/PieDelFormulario';
import { nombreDeMedio } from '@/lib/caja/pantalla';
import { MEDIOS } from '@/lib/caja/resultado';
import { conValorInicial } from '@/lib/formularios/valorInicial';
import { useGuardar } from '@/lib/gastos/useGuardar';
import { formatearPesos } from '@/lib/plata';
import { esquemaVenta, type DatosDeVenta } from '@/lib/ventas/esquemas';
import type { OpcionDeVenta } from '@/lib/ventas/opciones';
import { totalEscrito } from '@/lib/ventas/renglones';
import { guardarVentaDesdeElPanel } from '../acciones';
import { RenglonesDeVenta } from './RenglonesDeVenta';

type Props = {
  inicial: DatosDeVenta;
  canales: { id: string; nombre: string }[];
  opciones: OpcionDeVenta[];
};

const MEDIOS_PARA_ELEGIR = [
  { valor: '', texto: 'Elegí cómo se cobró' },
  ...MEDIOS.map((medio) => ({ valor: medio, texto: nombreDeMedio(medio) })),
];

// El total se recalcula con cada tecla, sin redibujar todo el formulario.
function TotalDeLaVenta({ control }: { control: Control<DatosDeVenta> }) {
  const renglones = useWatch({ control, name: 'renglones' });
  return <p className="text-lg font-bold">Total: {formatearPesos(totalEscrito(renglones))}</p>;
}

export function FormularioDeVenta({ inicial, canales, opciones }: Props) {
  const router = useRouter();
  const guardado = useGuardar(guardarVentaDesdeElPanel, ({ id }) =>
    router.push(`/admin/ventas/${id}`),
  );
  const { register, control, handleSubmit, setValue, formState } = useForm<DatosDeVenta>({
    resolver: zodResolver(esquemaVenta),
    defaultValues: inicial,
  });
  const { errors } = formState;
  const registro = conValorInicial(register, inicial);
  const elegirCanal = [
    { valor: '', texto: 'Elegí el canal' },
    ...canales.map((c) => ({ valor: c.id, texto: c.nombre })),
  ];
  return (
    <form onSubmit={handleSubmit(guardado.enviar)} noValidate className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Campo
          id="fecha"
          etiqueta="Fecha"
          type="date"
          error={errors.fecha?.message}
          {...registro('fecha')}
        />
        <CampoDeSeleccion
          id="canal"
          etiqueta="Canal"
          opciones={elegirCanal}
          error={errors.canalId?.message}
          {...registro('canalId')}
        />
        <CampoDeSeleccion
          id="medio"
          etiqueta="Medio de pago"
          opciones={MEDIOS_PARA_ELEGIR}
          error={errors.medio?.message}
          {...registro('medio')}
        />
      </div>
      <RenglonesDeVenta
        control={control}
        register={register}
        setValue={setValue}
        errors={errors}
        opciones={opciones}
      />
      <TotalDeLaVenta control={control} />
      <CampoDeTextoLargo
        id="comentario"
        etiqueta="Comentario"
        error={errors.comentario?.message}
        {...registro('comentario')}
      />
      {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
      <PieDelFormulario
        enviando={guardado.enviando}
        texto="Guardar venta"
        cancelar="/admin/ventas"
      />
    </form>
  );
}
