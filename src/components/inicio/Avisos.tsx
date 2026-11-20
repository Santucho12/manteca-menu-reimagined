import { AlertTriangle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { Aviso } from '@/lib/inicio/avisos';

/** Solo aparece si hay algo que atender; cada aviso lleva a donde se resuelve. */
export function Avisos({ avisos }: { avisos: Aviso[] }) {
  if (avisos.length === 0) return null;
  return (
    <section
      aria-labelledby="avisos"
      className="h-full flex flex-col rounded-2xl border border-rose-200 bg-card overflow-hidden"
    >
      <h2
        id="avisos"
        className="flex items-center gap-2 px-6 py-4 border-b border-rose-100 text-[10px] text-rose-700 font-bold uppercase tracking-widest"
      >
        <AlertTriangle size={16} aria-hidden="true" className="text-rose-600" />
        Para atender
        <span className="ml-auto rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-bold text-white">
          {avisos.length}
        </span>
      </h2>
      <ul className="flex-1 min-h-0 flex flex-col justify-evenly p-5">
        {avisos.map((aviso) => (
          <li key={aviso.texto}>
            <Link
              href={aviso.enlace}
              className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-white/60 px-5 py-4 text-sm font-bold hover:bg-white hover:border-slate-300 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              {aviso.texto}
              <span className="shrink-0 h-6 w-6 rounded-full bg-secondary text-muted-foreground flex items-center justify-center transition-all duration-200 group-hover:bg-rose-600 group-hover:text-white">
                <ChevronRight size={13} aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
