import { AlertTriangle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { Aviso } from '@/lib/inicio/avisos';

/** Solo aparece si hay algo que atender; cada aviso lleva a donde se resuelve. */
export function Avisos({ avisos }: { avisos: Aviso[] }) {
  if (avisos.length === 0) return null;
  return (
    <section
      aria-labelledby="avisos"
      className="h-full rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900 space-y-2"
    >
      <h2 id="avisos" className="flex items-center gap-2 text-sm font-bold">
        <AlertTriangle size={18} aria-hidden="true" className="text-rose-600" />
        Para atender
        <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-bold text-white">
          {avisos.length}
        </span>
      </h2>
      <ul className="space-y-2">
        {avisos.map((aviso) => (
          <li key={aviso.texto}>
            <Link
              href={aviso.enlace}
              className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-4 py-2.5 text-sm font-semibold hover:bg-white transition-colors"
            >
              {aviso.texto}
              <ChevronRight size={16} aria-hidden="true" className="shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
