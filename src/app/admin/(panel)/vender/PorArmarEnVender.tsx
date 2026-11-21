'use client';

import { PackageOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { PorArmar } from '@/lib/vender/consultas';
import { ArmarFacturas } from './ArmarFacturas';
import { VentanaDeVuelto } from './VentanaDeVuelto';

const HORA = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires',
  hour: '2-digit',
  minute: '2-digit',
});

type Props = {
  pendientes: PorArmar[];
  productos: Record<string, { id: string; nombre: string }[]>;
};

/** Arriba en Vender: las surtidas cobradas que quedaron sin armar, para armarlas cuando elijan. */
export function PorArmarEnVender({ pendientes, productos }: Props) {
  const router = useRouter();
  const [abierta, setAbierta] = useState<PorArmar | null>(null);
  if (pendientes.length === 0) return null;
  const cerrar = () => setAbierta(null);
  return (
    <section
      aria-label="Por armar"
      className="space-y-2 rounded-3xl border border-amber-200 bg-amber-50 p-4"
    >
      <p className="flex items-center gap-2 text-sm font-bold text-amber-900">
        <PackageOpen size={16} aria-hidden="true" /> Por armar ({pendientes.length})
      </p>
      <ul className="flex flex-wrap gap-2">
        {pendientes.map((p) => (
          <li key={p.renglonId}>
            <button
              type="button"
              onClick={() => setAbierta(p)}
              className="min-h-11 rounded-xl bg-white px-3 text-sm font-semibold text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100"
            >
              {p.descripcion} · {HORA.format(new Date(p.cerradaEn))}
            </button>
          </li>
        ))}
      </ul>
      {abierta ? (
        <VentanaDeVuelto
          efectivoCentavos={null}
          cerrar={cerrar}
          esperar
          armar={
            <ArmarFacturas
              key={abierta.renglonId}
              pendiente={abierta}
              productos={productos[abierta.categoriaId] ?? []}
              alTerminar={() => {
                setTimeout(cerrar, 900);
                router.refresh();
              }}
              despues={cerrar}
            />
          }
        />
      ) : null}
    </section>
  );
}
