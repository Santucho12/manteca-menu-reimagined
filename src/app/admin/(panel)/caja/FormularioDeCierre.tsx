'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Banknote } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { CampoDeTextoLargo } from '@/components/formularios/CampoDeTextoLargo';
import { PieDelFormulario } from '@/components/formularios/PieDelFormulario';
import { BOTON_PRINCIPAL } from '@/components/panel/estilos';
import { Seccion } from '@/components/panel/Seccion';
import { esquemaCierre, type DatosDeCierre } from '@/lib/caja/esquemas';
import { conValorInicial, type Registro } from '@/lib/formularios/valorInicial';
import { useGuardar } from '@/lib/gastos/useGuardar';
import { guardarCierreDesdeElPanel } from './acciones';
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {MONTOS.map(({ campo, etiqueta }) => (
        <Campo
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

function Guardado() {
  return (
    <Seccion forma="lista">
      <h2 className="text-xl font-bold tracking-tight text-slate-800">Cierre guardado</h2>
      <p className="text-sm">El resultado va a estar cuando entren las ventas del día.</p>
      <div>
        <Link href="/admin/caja/mis-cierres" className={`${BOTON_PRINCIPAL} w-fit`}>
          Ver mis cierres
        </Link>
      </div>
    </Seccion>
  );
}

export function FormularioDeCierre({ inicial }: { inicial: DatosDeCierre }) {
  const [listo, setListo] = useState(false);
  const guardado = useGuardar(guardarCierreDesdeElPanel, () => setListo(true));
  const { register, control, handleSubmit, formState } = useForm<DatosDeCierre>({
    resolver: zodResolver(esquemaCierre),
    defaultValues: inicial,
  });
  const { errors } = formState;
  const registro = conValorInicial(register, inicial);
  if (listo) return <Guardado />;
  return (
    <Seccion icono={<Banknote className="text-primary" size={24} />}>
      <form onSubmit={handleSubmit(guardado.enviar)} noValidate className="space-y-5">
        <Campo
          id="fecha"
          etiqueta="Fecha"
          type="date"
          error={errors.fecha?.message}
          {...registro('fecha')}
        />
        <Montos registro={registro} errors={errors} />
        <Retiros control={control} register={register} errors={errors} />
        <GastosDeCaja control={control} register={register} errors={errors} />
        <Campo
          id="queda-en-caja"
          etiqueta="Queda en la caja"
          inputMode="decimal"
          error={errors.quedaEnCaja?.message}
          {...registro('quedaEnCaja')}
        />
        <CampoDeTextoLargo
          id="comentario"
          etiqueta="Comentario"
          error={errors.comentario?.message}
          {...registro('comentario')}
        />
        {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
        <PieDelFormulario enviando={guardado.enviando} texto="Guardar cierre" />
      </form>
    </Seccion>
  );
}
