'use client';

import { Filter } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ACCESO_SECUNDARIO, ICONO_DE_ACCESO_SUAVE } from '@/components/panel/estilos';
import { Ventana } from '@/components/panel/Ventana';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import type { ResumenDeCategoria } from '@/lib/gastos/porCategoria';
import { formatearPesos } from '@/lib/plata';
import { cn } from '@/lib/utils';

type Props = {
  categoria: ResumenDeCategoria;
  /** A donde lleva "Filtrar la lista": la lista de Pagados con esta categoria, o sin ella si ya estaba. */
  enlace: string;
  activa: boolean;
};

const cantidadDe = (n: number) => (n === 1 ? '1 gasto' : `${n} gastos`);

function GastosDeLaCategoria({ categoria }: { categoria: ResumenDeCategoria }) {
  return (
    <ul aria-label={`Gastos de ${categoria.nombre}`} className="space-y-1.5">
      {categoria.gastos.map((gasto) => (
        <li
          key={gasto.id}
          className="flex items-center gap-3 rounded-2xl bg-secondary/40 px-3 py-2.5 text-sm"
        >
          <span className="w-12 shrink-0 rounded-xl bg-white py-1 text-center text-xs font-bold text-muted-foreground shadow-xs">
            {fechaParaMostrar(gasto.fecha).slice(0, 5)}
          </span>
          <span className="min-w-0 flex-1 wrap-break-word font-medium">
            {gasto.descripcion ?? 'Sin descripción'}
          </span>
          <span className="shrink-0 font-display text-base font-bold tabular-nums">
            {formatearPesos(gasto.montoCentavos)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** La tarjeta de una categoria: tocarla abre una ventana con todos sus gastos del mes. */
export function TarjetaDeCategoria({ categoria, enlace, activa }: Props) {
  const [abierta, setAbierta] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        className={cn(
          'block w-full rounded-2xl border bg-white p-4 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99]',
          activa ? 'border-foreground/30 ring-2 ring-foreground/10' : 'border-border',
        )}
      >
        {/* El nombre largo baja de renglón: en dos columnas de celular no entraba. */}
        <span className="block wrap-break-word text-sm font-semibold text-muted-foreground">
          {categoria.nombre}
        </span>
        <strong className="mt-2 block font-display text-xl font-bold tracking-tight sm:text-2xl">
          {formatearPesos(categoria.totalCentavos)}
        </strong>
        <span className="mt-1 block text-sm text-muted-foreground">
          {cantidadDe(categoria.cantidad)}
        </span>
      </button>
      <Ventana abierta={abierta} cerrar={() => setAbierta(false)} titulo={categoria.nombre}>
        <p className="mb-4 flex items-baseline gap-2">
          <strong className="font-display text-3xl font-bold tracking-tight">
            {formatearPesos(categoria.totalCentavos)}
          </strong>
          <span className="text-sm text-muted-foreground">{cantidadDe(categoria.cantidad)}</span>
        </p>
        <GastosDeLaCategoria categoria={categoria} />
        <Link
          href={enlace}
          onClick={() => setAbierta(false)}
          className={`${ACCESO_SECUNDARIO} mt-5`}
        >
          <span className={ICONO_DE_ACCESO_SUAVE}>
            <Filter size={15} aria-hidden="true" />
          </span>
          {activa ? 'Ver todos los gastos' : 'Filtrar la lista'}
        </Link>
      </Ventana>
    </>
  );
}
