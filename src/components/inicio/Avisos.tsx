'use client';

import { AlertTriangle } from 'lucide-react';
import type { Aviso } from '@/lib/inicio/avisos';
import { avisosALaVista } from '@/lib/inicio/avisosALaVista';
import { useDescartados } from '@/lib/inicio/useDescartados';
import { FilaDeAviso } from './FilaDeAviso';
import { SOMBRA_DE_INICIO } from './sombraDeInicio';
import { VerTodosLosAvisos } from './VerTodosLosAvisos';

/** Solo aparece si hay algo que atender; cada aviso lleva a donde se resuelve. */
export function Avisos({ avisos }: { avisos: Aviso[] }) {
  const { quedan, descartar } = useDescartados(avisos);
  if (quedan.length === 0) return null;
  const { visibles, ocultos } = avisosALaVista(quedan);
  return (
    <section
      aria-labelledby="avisos"
      className={`h-full flex flex-col rounded-2xl border border-border bg-card overflow-hidden ${SOMBRA_DE_INICIO}`}
    >
      <h2
        id="avisos"
        className="flex items-center gap-2 px-6 py-4 border-b border-border text-[10px] text-rose-700 font-bold uppercase tracking-widest"
      >
        <AlertTriangle size={16} aria-hidden="true" className="text-rose-600" />
        Para atender
        <span className="ml-auto rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-bold text-white">
          {quedan.length}
        </span>
      </h2>
      <ul className="flex-1 min-h-0 flex flex-col gap-2.5 p-5">
        {visibles.map((aviso) => (
          <FilaDeAviso key={aviso.texto} aviso={aviso} descartar={descartar} />
        ))}
      </ul>
      {ocultos > 0 ? (
        <VerTodosLosAvisos avisos={quedan} ocultos={ocultos} descartar={descartar} />
      ) : null}
    </section>
  );
}
