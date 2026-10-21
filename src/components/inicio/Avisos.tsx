import { AlertTriangle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Panel } from '@/components/panel/Piezas';
import type { Aviso } from '@/lib/inicio/avisos';

// Con el dorado de la marca y borde marcado: es lo unico de Inicio que pide accion.
function Cabecera({ cantidad }: { cantidad: number }) {
  return (
    <>
      <h2
        id="avisos"
        className="flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-foreground uppercase"
      >
        <AlertTriangle size={18} aria-hidden="true" className="text-accent" />
        Para atender
      </h2>
      <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
        {cantidad}
      </span>
    </>
  );
}

/** Solo aparece si hay algo que atender; cada aviso lleva a donde se resuelve. */
export function Avisos({ avisos, className = '' }: { avisos: Aviso[]; className?: string }) {
  if (avisos.length === 0) return null;
  return (
    <Panel
      etiquetadoPor="avisos"
      className={`border-accent/50 bg-accent/5 ${className}`}
      etiqueta={<Cabecera cantidad={avisos.length} />}
    >
      <ul className="space-y-3 p-4">
        {avisos.map((a) => (
          <li key={a.texto}>
            <Link
              href={a.enlace}
              className="flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-card border border-accent/40 px-5 py-3.5 font-bold shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent hover:bg-accent/10 hover:shadow-md active:translate-y-0 active:scale-[0.99]"
            >
              {a.texto}
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                <ChevronRight size={18} aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
