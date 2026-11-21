'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ChangeEvent } from 'react';
import { useForm, useWatch, type Control } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { destinoDeLaFecha } from '@/lib/caja/cierreACargar';
import { esquemaCierre, type DatosDeCierre } from '@/lib/caja/esquemas';
import { contadoAlCargar } from '@/lib/caja/vistaDelCierre';
import { conValorInicial } from '@/lib/formularios/valorInicial';
import { useGuardar } from '@/lib/gastos/useGuardar';
import { formatearPesos } from '@/lib/plata';
import { editarCierreDesdeElPanel, guardarCierreDesdeElPanel } from './acciones';
import {
  ComentarioDeLaCarga,
  QuedaEnCaja,
  TiposDeLaCarga,
  type TipoControlado,
} from './CierreDeLaCarga';
import { EncabezadoDeLaCarga } from './EncabezadoDeLaCarga';
import { MediosDeLaCaja } from './MediosDeLaCaja';
import { SalidasDeLaCaja } from './SalidasDeLaCaja';

type PropsDeBarra = { control: Control<DatosDeCierre>; enviando: boolean; texto: string };

// Abajo, siempre a la vista: lo que se lleva contado (solo lo escrito) y el botón para guardar.
function BarraDeGuardar({ control, enviando, texto }: PropsDeBarra) {
  const datos = useWatch({ control }) as DatosDeCierre;
  const { mediosCentavos, salidasCentavos } = contadoAlCargar(datos);
  return (
    <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white/95 p-4 shadow-card backdrop-blur md:p-5">
      <dl className="flex gap-6">
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Contado
          </dt>
          <dd className="font-display text-xl font-bold tabular-nums">
            {formatearPesos(mediosCentavos)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Salió</dt>
          <dd className="font-display text-xl font-bold tabular-nums text-rose-600">
            {formatearPesos(salidasCentavos)}
          </dd>
        </div>
      </dl>
      <button
        type="submit"
        disabled={enviando}
        className="inline-flex h-12 items-center gap-2 rounded-full bg-emerald-600 px-7 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-60"
      >
        <Save size={16} aria-hidden="true" />
        {enviando ? 'Guardando...' : texto}
      </button>
    </div>
  );
}

type Props = {
  inicial: DatosDeCierre;
  hoy?: string;
  /** Con el id se edita un cierre guardado; sin él, se carga uno nuevo. */
  id?: string;
  quien?: string;
  avisoDelFondo?: string | null;
  tipos?: TipoControlado[];
};

/** Cargar (o editar) un cierre en una sola pantalla; al guardar, abre su resultado. */
export function CargaDelCierre({ inicial, hoy, id, quien, avisoDelFondo, tipos = [] }: Props) {
  const router = useRouter();
  const guardar = (datos: DatosDeCierre) =>
    id ? editarCierreDesdeElPanel({ ...datos, id }) : guardarCierreDesdeElPanel(datos);
  const guardado = useGuardar(guardar, (r) =>
    router.push(`/admin/caja/cierres/${id ?? (r as { id: string }).id}`),
  );
  const { register, control, handleSubmit, formState } = useForm<DatosDeCierre>({
    resolver: zodResolver(esquemaCierre),
    defaultValues: inicial,
  });
  const registro = conValorInicial(register, inicial);
  const campoFecha = registro('fecha');
  // Cargando, otra fecha vuelve a pedir su turno y su fondo.
  const cambiarFecha = (evento: ChangeEvent<HTMLInputElement>) => {
    void campoFecha.onChange(evento);
    const destino = !id && hoy ? destinoDeLaFecha(evento.target.value, inicial.fecha, hoy) : null;
    if (destino) router.push(destino);
  };
  const { errors } = formState;
  const partes = { registro, errors };
  return (
    <form onSubmit={handleSubmit(guardado.enviar)} noValidate className="space-y-5">
      <EncabezadoDeLaCarga
        registro={registro}
        inicial={inicial}
        quien={quien}
        fijo={Boolean(id)}
        cambiarFecha={cambiarFecha}
        cambiarTurno={(turno) => router.push(`/admin/caja?fecha=${inicial.fecha}&turno=${turno}`)}
      />
      <MediosDeLaCaja {...partes} avisoDelFondo={avisoDelFondo} />
      <SalidasDeLaCaja control={control} {...partes} />
      <QuedaEnCaja {...partes} />
      <TiposDeLaCarga {...partes} tipos={tipos} />
      <ComentarioDeLaCarga {...partes} />
      {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
      <BarraDeGuardar
        control={control}
        enviando={guardado.enviando}
        texto={id ? 'Guardar cambios' : 'Guardar cierre'}
      />
    </form>
  );
}
