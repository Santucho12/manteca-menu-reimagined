'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { CampoDeTextoLargo } from '@/components/formularios/CampoDeTextoLargo';
import { Button } from '@/components/ui/button';
import { esquemaCierre, type DatosDeCierre } from '@/lib/caja/esquemas';
import { useGuardar } from '@/lib/gastos/useGuardar';
import { guardarCierreDesdeElPanel } from './acciones';
import { GastosDeCaja, Retiros } from './Salidas';

type CamposDeMonto = 'fondoInicial' | 'efectivo' | 'credito' | 'debito' | 'qr' | 'transferencia';
type Registro = { register: UseFormRegister<DatosDeCierre>; errors: FieldErrors<DatosDeCierre> };

const MONTOS: { campo: CamposDeMonto; etiqueta: string }[] = [
  { campo: 'fondoInicial', etiqueta: 'Fondo inicial' },
  { campo: 'efectivo', etiqueta: 'Efectivo contado' },
  { campo: 'credito', etiqueta: 'Tarjeta de crédito' },
  { campo: 'debito', etiqueta: 'Tarjeta de débito' },
  { campo: 'qr', etiqueta: 'QR' },
  { campo: 'transferencia', etiqueta: 'Transferencia' },
];

// Lo declarado por medio de pago. No muestra lo esperado: el conteo es a ciegas.
function Montos({ register, errors }: Registro) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {MONTOS.map(({ campo, etiqueta }) => (
        <Campo
          key={campo}
          id={campo}
          etiqueta={etiqueta}
          inputMode="decimal"
          error={errors[campo]?.message}
          {...register(campo)}
        />
      ))}
    </div>
  );
}

function Guardado() {
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Cierre guardado</h2>
      <p>El resultado va a estar cuando entren las ventas del día.</p>
      <Button asChild>
        <Link href="/admin/caja/mis-cierres">Ver mis cierres</Link>
      </Button>
    </section>
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
  if (listo) return <Guardado />;
  return (
    <form onSubmit={handleSubmit(guardado.enviar)} noValidate className="max-w-xl space-y-5">
      {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
      <Campo
        id="fecha"
        etiqueta="Fecha"
        type="date"
        error={errors.fecha?.message}
        {...register('fecha')}
      />
      <Montos register={register} errors={errors} />
      <Retiros control={control} register={register} errors={errors} />
      <GastosDeCaja control={control} register={register} errors={errors} />
      <Campo
        id="queda-en-caja"
        etiqueta="Queda en la caja"
        inputMode="decimal"
        error={errors.quedaEnCaja?.message}
        {...register('quedaEnCaja')}
      />
      <CampoDeTextoLargo
        id="comentario"
        etiqueta="Comentario"
        error={errors.comentario?.message}
        {...register('comentario')}
      />
      <Button type="submit" disabled={guardado.enviando} className="w-full sm:w-auto">
        {guardado.enviando ? 'Guardando…' : 'Guardar cierre'}
      </Button>
    </form>
  );
}
