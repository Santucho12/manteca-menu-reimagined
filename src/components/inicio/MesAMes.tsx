'use client';

import { Maximize2, Minimize2 } from 'lucide-react';
import { useState } from 'react';
import { Etiqueta, Panel } from '@/components/panel/Piezas';
import { GraficoPorMes } from '@/components/reportes/GraficoPorMes';
import { mesesVisibles } from '@/lib/inicio/meses';
import type { ResultadoDelMes } from '@/lib/reportes/resultado';

type Props = { datos: ResultadoDelMes[]; className?: string };

/** El grafico mes a mes: los ultimos 4 meses y, con el boton, todo el año. */
export function MesAMes({ datos, className }: Props) {
  const [ampliado, setAmpliado] = useState(false);
  const Icono = ampliado ? Minimize2 : Maximize2;
  return (
    <Panel
      etiquetadoPor="mes-a-mes"
      className={className}
      etiqueta={
        <Etiqueta as="h2" id="mes-a-mes">
          Mes a mes
        </Etiqueta>
      }
      extra={
        <button
          type="button"
          aria-pressed={ampliado}
          onClick={() => setAmpliado(!ampliado)}
          className="text-muted-foreground hover:bg-secondary hover:text-foreground flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-bold transition-colors"
        >
          <Icono size={16} aria-hidden="true" />
          {ampliado ? 'Ver 4 meses' : 'Ver todo el año'}
        </button>
      }
    >
      <div className="p-6">
        <GraficoPorMes datos={mesesVisibles(datos, ampliado)} />
      </div>
    </Panel>
  );
}
