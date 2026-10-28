'use client';

import { Filter } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
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
    <ul aria-label={`Gastos de ${categoria.nombre}`} className="divide-y divide-border">
      {categoria.gastos.map((gasto) => (
        <li key={gasto.id} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
          <span className="min-w-0">
            <span className="font-bold text-muted-foreground">
              {fechaParaMostrar(gasto.fecha).slice(0, 5)}
            </span>{' '}
            {gasto.descripcion ?? 'Sin descripción'}
          </span>
          <span className="shrink-0 font-bold tabular-nums">
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
          'block w-full rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 active:scale-[0.99]',
          activa
            ? 'bg-secondary border-foreground/25 shadow-md'
            : 'bg-card border-border shadow-xs hover:shadow-md',
        )}
      >
        <span className="block truncate text-xs font-black uppercase tracking-widest text-muted-foreground">
          {categoria.nombre}
        </span>
        <strong className="mt-1 block font-display text-xl font-bold tracking-tight">
          {formatearPesos(categoria.totalCentavos)}
        </strong>
        <span className="text-xs text-muted-foreground">{cantidadDe(categoria.cantidad)}</span>
      </button>
      <Ventana abierta={abierta} cerrar={() => setAbierta(false)} titulo={categoria.nombre}>
        <p className="mb-3 text-sm text-muted-foreground">
          {cantidadDe(categoria.cantidad)} ·{' '}
          <strong>{formatearPesos(categoria.totalCentavos)}</strong>
        </p>
        <GastosDeLaCategoria categoria={categoria} />
        <Link
          href={enlace}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-foreground hover:underline"
        >
          <Filter size={14} aria-hidden="true" />{' '}
          {activa ? 'Ver todos los gastos' : 'Filtrar la lista'}
        </Link>
      </Ventana>
    </>
  );
}
