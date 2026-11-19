'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Banknote } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { CampoDeTextoLargo } from '@/components/formularios/CampoDeTextoLargo';
import { PieDelFormulario } from '@/components/formularios/PieDelFormulario';
import { FranjaDeAviso } from '@/components/panel/Avisos';
import { Seccion } from '@/components/panel/Seccion';
import { esquemaCierre, type DatosDeCierre } from '@/lib/caja/esquemas';
import { conValorInicial, type Registro } from '@/lib/formularios/valorInicial';
import { useGuardar } from '@/lib/gastos/useGuardar';
import { editarCierreDesdeElPanel, guardarCierreDesdeElPanel } from './acciones';
import { CAMPO_CONTRASTADO } from './contraste';
import { ElegirTurno } from './ElegirTurno';
import { GastosDeCaja, Retiros } from './Salidas';

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

type Props = { inicial: DatosDeCierre; id?: string; avisoDelFondo?: string | null };

/** Cargar un cierre nuevo o, con el id, editar uno existente; al terminar abre su resultado. */
export function FormularioDeCierre({ inicial, id, avisoDelFondo }: Props) {
  const router = useRouter();
  const verDetalle = (cierre: string) => router.push(`/admin/caja/cierres/${cierre}`);
  const guardar = (datos: DatosDeCierre) =>
    id ? editarCierreDesdeElPanel({ ...datos, id }) : guardarCierreDesdeElPanel(datos);
  const guardado = useGuardar(guardar, (respuesta) =>
    verDetalle(id ?? (respuesta as { id: string }).id),
  );
  const { register, control, handleSubmit, formState } = useForm<DatosDeCierre>({
    resolver: zodResolver(esquemaCierre),
    defaultValues: inicial,
  });
  const { errors } = formState;
  const registro = conValorInicial(register, inicial);
  return (
    <Seccion icono={<Banknote className="text-primary" size={24} />}>
      <form onSubmit={handleSubmit(guardado.enviar)} noValidate className="space-y-5">
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
          {...registro('fecha')}
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
        <CampoDeTextoLargo
          className={CAMPO_CONTRASTADO}
          id="comentario"
          etiqueta="Comentario"
          error={errors.comentario?.message}
          {...registro('comentario')}
        />
        {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
        <PieDelFormulario
          blanco
          enviando={guardado.enviando}
          texto={id ? 'Guardar cambios' : 'Guardar cierre'}
        />
      </form>
    </Seccion>
  );
}
