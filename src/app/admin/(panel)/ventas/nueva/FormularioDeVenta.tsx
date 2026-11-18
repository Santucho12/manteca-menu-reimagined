'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm, useWatch, type Control } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { Casilla } from '@/components/formularios/Casilla';
import { CampoDeSeleccion } from '@/components/formularios/CampoDeSeleccion';
import { nombreDeMedio } from '@/lib/caja/pantalla';
import { MEDIOS } from '@/lib/caja/resultado';
import { conValorInicial } from '@/lib/formularios/valorInicial';
import { useGuardar } from '@/lib/gastos/useGuardar';
import { formatearPesos } from '@/lib/plata';
import { esquemaVenta, type DatosDeVenta } from '@/lib/ventas/esquemas';
import type { OpcionDeVenta } from '@/lib/ventas/opciones';
import { totalEscrito } from '@/lib/ventas/renglones';
import { guardarVentaDesdeElPanel } from '../acciones';
import { BarraDeGuardar } from './BarraDeGuardar';
import { RenglonesDeVenta } from './RenglonesDeVenta';
import { TarjetaDePaso } from '@/components/panel/TarjetaDePaso';

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
  return (
    <p className="text-sm font-semibold text-muted-foreground">
      <span className="mr-2">Total:</span>
      <span className="font-display text-2xl font-bold text-foreground">
        {formatearPesos(totalEscrito(renglones))}
      </span>
    </p>
  );
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
    { valor: '', texto: 'Elegí el tipo de venta' },
    ...canales.map((c) => ({ valor: c.id, texto: c.nombre })),
  ];
  return (
    <form onSubmit={handleSubmit(guardado.enviar)} noValidate className="space-y-3">
      <TarjetaDePaso
        numero={1}
        titulo="Cómo fue la venta"
        ayuda="Cuándo, por dónde entró y cómo se cobró."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Campo
            id="fecha"
            etiqueta="Fecha"
            type="date"
            error={errors.fecha?.message}
            {...registro('fecha')}
          />
          <CampoDeSeleccion
            id="canal"
            etiqueta="Tipo de venta"
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
      </TarjetaDePaso>
      <TarjetaDePaso
        numero={2}
        titulo="Qué se vendió"
        ayuda="El precio viene del menú y lo podés cambiar."
      >
        <RenglonesDeVenta
          control={control}
          register={register}
          setValue={setValue}
          errors={errors}
          opciones={opciones}
        />
      </TarjetaDePaso>
      <section className="space-y-3 rounded-3xl border border-border bg-white px-4 py-3 shadow-sm shadow-slate-900/5 md:px-6">
        <Campo
          id="comentario"
          etiqueta="Comentario (opcional)"
          placeholder="Ej: encargo para el sábado"
          error={errors.comentario?.message}
          {...registro('comentario')}
        />
        <Casilla
          id="en-la-caja"
          etiqueta="Se cobró en la caja del local"
          {...register('enLaCaja')}
        />
      </section>
      {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
      <BarraDeGuardar total={<TotalDeLaVenta control={control} />} enviando={guardado.enviando} />
    </form>
  );
}
