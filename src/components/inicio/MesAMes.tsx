'use client';

import { Maximize2, Minimize2 } from 'lucide-react';
import { useState } from 'react';
import { GraficoPorMes } from '@/components/reportes/GraficoPorMes';
import { mesesVisibles } from '@/lib/inicio/meses';
import type { ResultadoDelMes } from '@/lib/reportes/resultado';

/** El grafico mes a mes: los ultimos 4 meses y, con el boton, todo el año. */
export function MesAMes({ datos }: { datos: ResultadoDelMes[] }) {
  const [ampliado, setAmpliado] = useState(false);
  const Icono = ampliado ? Minimize2 : Maximize2;
  return (
    <section
      aria-labelledby="mes-a-mes"
      className="rounded-2xl border border-border bg-card p-5 md:p-6"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2
          id="mes-a-mes"
          className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans"
        >
          Mes a mes
        </h2>
        <button
          type="button"
          aria-pressed={ampliado}
          onClick={() => setAmpliado(!ampliado)}
          className="h-9 px-3 rounded-xl text-xs font-bold bg-secondary/60 text-slate-600 hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-1.5"
        >
          <Icono size={14} aria-hidden="true" />
          {ampliado ? 'Ver 4 meses' : 'Ver todo el año'}
        </button>
      </div>
      <GraficoPorMes datos={mesesVisibles(datos, ampliado)} />
    </section>
  );
}
