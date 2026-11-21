'use client';

import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { BOTON_DE_TARJETA, CIRCULO_DE_BOTON, FLECHA_DE_BOTON } from '@/components/panel/estilos';
import { GraficoPorMes } from '@/components/reportes/GraficoPorMes';
import { mesesVisibles } from '@/lib/inicio/meses';
import type { ResultadoDelMes } from '@/lib/reportes/resultado';
import { EncabezadoDeTarjeta } from './EncabezadoDeTarjeta';
import { SOMBRA_DE_INICIO } from './sombraDeInicio';

type Props = { datos: ResultadoDelMes[]; mesEnCurso: string };

/** El grafico mes a mes: los ultimos 4 meses y, con el boton, todo el año. */
export function MesAMes({ datos, mesEnCurso }: Props) {
  const [ampliado, setAmpliado] = useState(false);
  const Icono = ampliado ? ArrowDownLeft : ArrowUpRight;
  return (
    <section
      aria-labelledby="mes-a-mes"
      className={`h-full flex flex-col rounded-2xl border border-border bg-card p-6 md:p-8 ${SOMBRA_DE_INICIO}`}
    >
      <EncabezadoDeTarjeta
        titulo="Mes a mes"
        descripcion="Ventas, gastos y balance de cada mes."
        id="mes-a-mes"
      >
        <button
          type="button"
          aria-pressed={ampliado}
          onClick={() => setAmpliado(!ampliado)}
          className={BOTON_DE_TARJETA}
        >
          {ampliado ? 'Ver 4 meses' : 'Ver todo el año'}
          <span className={CIRCULO_DE_BOTON}>
            <Icono size={15} strokeWidth={2.6} aria-hidden="true" className={FLECHA_DE_BOTON} />
          </span>
        </button>
      </EncabezadoDeTarjeta>
      <GraficoPorMes
        datos={mesesVisibles(datos, ampliado)}
        alto="flex-1 min-h-64"
        mesEnCurso={mesEnCurso}
      />
    </section>
  );
}
