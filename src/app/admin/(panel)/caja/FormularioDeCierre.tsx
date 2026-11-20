'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Banknote } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { Campo } from '@/components/formularios/Campo';
import { FranjaDeAviso } from '@/components/panel/Avisos';
import { BOTON_PRINCIPAL } from '@/components/panel/estilos';
import { Seccion } from '@/components/panel/Seccion';
import { esquemaCierre, type DatosDeCierre } from '@/lib/caja/esquemas';
import { conValorInicial, type Registro } from '@/lib/formularios/valorInicial';
import { useGuardar } from '@/lib/gastos/useGuardar';
import { destinoDeLaFecha } from '@/lib/caja/cierreACargar';
import { usePasosDelCierre } from '@/lib/caja/usePasosDelCierre';
import { editarCierreDesdeElPanel, guardarCierreDesdeElPanel } from './acciones';
import { CAMPO_CONTRASTADO } from './contraste';
import { ElegirTurno } from './ElegirTurno';
import { GastosDeCaja, Retiros } from './Salidas';
import { VentanasDelCierre, type TipoControlado } from './VentanasDelCierre';

type CamposDeMonto = 'fondoInicial' | 'efectivo' | 'credito' | 'debito' | 'qr' | 'transferencia';

const MONTOS: { campo: CamposDeMonto; etiqueta: string }[] = [
  { campo: 'fondoInicial', etiqueta: 'Fondo inicial' },
  { campo: 'efectivo', etiqueta: 'Efectivo contado' },
  { campo: 'credito', etiqueta: 'Tarjeta de crédito' },
  { campo: 'debito', etiqueta: 'Tarjeta de débito' },
  { campo: 'qr', etiqueta: 'QR' },
  { campo: 'transferencia', etiqueta: 'Transferencia' },
];

type PropsDeMontos = {
  registro: Registro<DatosDeCierre>;
  errors: Partial<Record<CamposDeMonto, { message?: string }>>;
};

// Lo declarado por medio de pago. No muestra lo esperado: el conteo es a ciegas.
function Montos({ registro, errors }: PropsDeMontos) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {MONTOS.map(({ campo, etiqueta }) => (
        <Campo
          className={CAMPO_CONTRASTADO}
          key={campo}
          id={campo}
          etiqueta={etiqueta}
          inputMode="decimal"
          error={errors[campo]?.message}
          {...registro(campo)}
        />
      ))}
    </div>
  );
}

type Props = {
  inicial: DatosDeCierre;
  /** Al cargar, cambiar la fecha vuelve a pedir el turno y el fondo de ese dia. */
  hoy?: string;
  id?: string;
  avisoDelFondo?: string | null;
  tipos?: TipoControlado[];
};

/** Cargar un cierre nuevo o, con el id, editar uno existente; al terminar abre su resultado. */
export function FormularioDeCierre({ inicial, hoy, id, avisoDelFondo, tipos = [] }: Props) {
  const router = useRouter();
  const verDetalle = (cierre: string) => router.push(`/admin/caja/cierres/${cierre}`);
  const guardar = (datos: DatosDeCierre) =>
    id ? editarCierreDesdeElPanel({ ...datos, id }) : guardarCierreDesdeElPanel(datos);
  const guardado = useGuardar(guardar, (respuesta) =>
    verDetalle(id ?? (respuesta as { id: string }).id),
  );
  const { register, control, handleSubmit, formState, trigger } = useForm<DatosDeCierre>({
    resolver: zodResolver(esquemaCierre),
    defaultValues: inicial,
  });
  const { errors } = formState;
  const registro = conValorInicial(register, inicial);
  const pasos = usePasosDelCierre(tipos.length, (campos) => trigger(campos));
  const campoFecha = registro('fecha');
  const cambiarFecha = (evento: { target: { value: string } }) => {
    void campoFecha.onChange(evento as never);
    const destino = !id && hoy ? destinoDeLaFecha(evento.target.value, inicial.fecha, hoy) : null;
    if (destino) router.push(destino);
  };
  // Enter en la caja pasa al paso siguiente; guardar es el último paso, en su ventana.
  const siguiente = (evento: FormEvent) => {
    evento.preventDefault();
    void pasos.avanzar();
  };
  return (
    <Seccion icono={<Banknote className="text-primary" size={24} />}>
      <form onSubmit={siguiente} noValidate className="space-y-5">
        <ElegirTurno
          fecha={inicial.fecha}
          turno={Number(inicial.turno) as 1 | 2}
          fijo={Boolean(id)}
        />
        <Campo
          className={CAMPO_CONTRASTADO}
          id="fecha"
          etiqueta="Fecha"
          type="date"
          readOnly={Boolean(id)}
          error={errors.fecha?.message}
          {...campoFecha}
          onChange={cambiarFecha}
        />
        {avisoDelFondo ? (
          <FranjaDeAviso>
            <p>{avisoDelFondo}</p>
          </FranjaDeAviso>
        ) : null}
        <Montos registro={registro} errors={errors} />
        <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2">
          <Retiros control={control} register={register} errors={errors} />
          <GastosDeCaja control={control} register={register} errors={errors} />
        </div>
        <Campo
          className={CAMPO_CONTRASTADO}
          id="queda-en-caja"
          etiqueta="Queda en la caja"
          inputMode="decimal"
          error={errors.quedaEnCaja?.message}
          {...registro('quedaEnCaja')}
        />
        <button type="submit" className={BOTON_PRINCIPAL}>
          Siguiente
          <ArrowRight size={14} aria-hidden="true" />
        </button>
        <VentanasDelCierre
          {...pasos}
          cerrar={pasos.volverALaCaja}
          tipos={tipos}
          registro={registro}
          errors={errors}
          guardar={handleSubmit(guardado.enviar)}
          enviando={guardado.enviando}
          mensaje={guardado.mensaje}
          textoDeGuardar={id ? 'Guardar cambios' : 'Guardar cierre'}
        />
      </form>
    </Seccion>
  );
}
