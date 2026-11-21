'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Aviso } from '@/lib/inicio/avisos';
import { FilaDeAviso } from './FilaDeAviso';

/** "Ver todos": la lista entera en una ventana con scroll (Santiago, 2026-11-20). */
type Props = { avisos: Aviso[]; ocultos: number; descartar: (aviso: Aviso) => void };

export function VerTodosLosAvisos({ avisos, ocultos, descartar }: Props) {
  const [abierta, setAbierta] = useState(false);
  useEffect(() => {
    if (!abierta) return;
    const cerrar = (e: KeyboardEvent) => e.key === 'Escape' && setAbierta(false);
    window.addEventListener('keydown', cerrar);
    return () => window.removeEventListener('keydown', cerrar);
  }, [abierta]);
  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        className="mx-5 mb-5 h-10 rounded-xl bg-foreground text-sm font-bold text-white transition-transform hover:-translate-y-0.5 active:translate-y-0"
      >
        Ver todos ({ocultos} más)
      </button>
      {abierta ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-md"
          onClick={() => setAbierta(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="todos-los-avisos"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-border px-6 py-4">
              <AlertTriangle size={16} aria-hidden="true" className="text-rose-600" />
              <h2
                id="todos-los-avisos"
                className="text-[11px] font-bold uppercase tracking-widest text-rose-700"
              >
                Para atender ({avisos.length})
              </h2>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setAbierta(false)}
                className="ml-auto rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <ul className="space-y-3 overflow-y-auto p-5">
              {avisos.map((aviso) => (
                <FilaDeAviso key={aviso.texto} aviso={aviso} descartar={descartar} />
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
