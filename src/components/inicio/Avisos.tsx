import { AlertTriangle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Panel } from '@/components/panel/Piezas';
import type { Aviso } from '@/lib/inicio/avisos';

// Ambar y no el color de marca: es lo unico de Inicio que pide accion, y tiene que verse primero.
function Cabecera({ cantidad }: { cantidad: number }) {
  return (
    <>
      <h2
        id="avisos"
        className="flex items-center gap-2 text-xs font-extrabold tracking-[0.18em] text-amber-900 uppercase"
      >
        <AlertTriangle size={18} aria-hidden="true" className="text-amber-600" />
        Para atender
      </h2>
      <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-extrabold text-white">
        {cantidad}
      </span>
    </>
  );
}

/** Solo aparece si hay algo que atender; cada aviso lleva a donde se resuelve. */
export function Avisos({ avisos }: { avisos: Aviso[] }) {
  if (avisos.length === 0) return null;
  return (
    <Panel
      etiquetadoPor="avisos"
      className="border-amber-300 bg-amber-50/60 shadow-[0_8px_24px_-12px_rgba(217,119,6,0.35)]"
      etiqueta={<Cabecera cantidad={avisos.length} />}
    >
      <ul className="space-y-3 p-4">
        {avisos.map((a) => (
          <li key={a.texto}>
            <Link
              href={a.enlace}
              className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-white px-5 py-3.5 font-bold shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-100 hover:shadow-md active:translate-y-0 active:scale-[0.99]"
            >
              {a.texto}
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-amber-500 text-white">
                <ChevronRight size={18} aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
