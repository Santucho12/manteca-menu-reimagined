import { AlertTriangle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Panel } from '@/components/panel/Piezas';
import type { Aviso } from '@/lib/inicio/avisos';

// En rojo y no en el dorado de la marca: es lo unico de Inicio que pide accion, y tiene que verse
// distinto de todo lo demas.
function Cabecera({ cantidad }: { cantidad: number }) {
  return (
    <>
      <h2
        id="avisos"
        className="flex items-center gap-3 text-xs font-bold tracking-[0.18em] uppercase"
      >
        <span className="grid size-9 place-items-center rounded-xl bg-rose-100 text-rose-600">
          <AlertTriangle size={18} aria-hidden="true" />
        </span>
        Para atender
      </h2>
      <span className="rounded-full bg-rose-500 px-3 py-1 text-xs font-bold text-white">
        {cantidad}
      </span>
    </>
  );
}

const BOTON =
  'flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-rose-100 bg-white px-5 py-3.5 font-bold shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50 hover:shadow-md active:translate-y-0 active:scale-[0.99]';

/** Solo aparece si hay algo que atender; cada aviso lleva a donde se resuelve. */
export function Avisos({ avisos, className = '' }: { avisos: Aviso[]; className?: string }) {
  if (avisos.length === 0) return null;
  return (
    <Panel
      etiquetadoPor="avisos"
      className={`border-rose-100 bg-rose-50/40 shadow-[0_12px_30px_-16px_rgba(251,113,133,0.3)] ${className}`}
      etiqueta={<Cabecera cantidad={avisos.length} />}
    >
      <ul className="space-y-3 p-4">
        {avisos.map((a) => (
          <li key={a.texto}>
            <Link href={a.enlace} className={BOTON}>
              {a.texto}
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-rose-500 text-white">
                <ChevronRight size={18} aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
