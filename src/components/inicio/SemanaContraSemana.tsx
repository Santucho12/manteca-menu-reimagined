'use client';

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EnlaceASeccion } from '@/components/panel/EnlaceASeccion';
import type { EstadoDeVariacion } from '@/lib/inicio/estadoDeVariacion';
import { TOOLTIP_DE_LINEAS } from '@/components/reportes/estiloDelTooltip';
import { pesosCortos } from '@/lib/reportes/ejeCorto';
import { CartelDeSemana } from './CartelDeSemana';
import { EncabezadoDeTarjeta } from './EncabezadoDeTarjeta';
import type { DiaDeLaSemana } from '@/lib/inicio/semana';
import {
  AYUDAS_DE_LA_SEMANA,
  acumularSemana,
  resumenDeLaSemana,
  type PuntoAcumulado,
} from '@/lib/inicio/semanaAcumulada';
import { COLORES_DE_LA_SEMANA } from '@/lib/inicio/coloresDeInicio';
import { EtiquetaConAyuda } from './EtiquetaConAyuda';
import { SOMBRA_DE_INICIO } from './sombraDeInicio';

// La semana actual en azul y la anterior en rojo, punteada (Santiago, 2026-10-25).
const COLORES = COLORES_DE_LA_SEMANA;
const EJE = { stroke: '#94a3b8', fontSize: 10, fontWeight: 700 };
const CHIP: Record<EstadoDeVariacion, string> = {
  mejora: 'bg-emerald-100 text-emerald-800',
  empeora: 'bg-rose-100 text-rose-800',
  igual: 'bg-secondary text-foreground',
  'sin-datos': 'bg-secondary text-foreground',
};

type PuntoDelFinal = { cx?: number; cy?: number; index?: number };

/** Las ventas de la semana sumadas dia a dia, contra la semana anterior: si vas adelantado o atrasado. */
export function SemanaContraSemana({ datos }: { datos: DiaDeLaSemana[] }) {
  const resumen = resumenDeLaSemana(datos);
  return (
    <section
      aria-label="Esta semana vs la anterior"
      className={`h-full rounded-2xl border border-border bg-card p-6 md:p-8 ${SOMBRA_DE_INICIO}`}
    >
      <EncabezadoDeTarjeta
        titulo="Esta semana vs la anterior"
        descripcion="Lo vendido sumado día a día, contra la semana pasada."
      >
        <EnlaceASeccion
          clave="reportes"
          seccion="Reportes"
          href="/admin/reportes/ventas"
          texto="Ver reportes"
        />
      </EncabezadoDeTarjeta>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3>
          <EtiquetaConAyuda
            ayuda={AYUDAS_DE_LA_SEMANA.titulo}
            lado="izquierda"
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${CHIP[resumen.estado]}`}
          >
            {resumen.titulo}
          </EtiquetaConAyuda>
        </h3>
        <EtiquetaConAyuda
          ayuda={AYUDAS_DE_LA_SEMANA.chip}
          lado="derecha"
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${CHIP[resumen.estado]}`}
        >
          {resumen.chip}
        </EtiquetaConAyuda>
      </div>
      <GraficoAcumulado puntos={acumularSemana(datos)} />
    </section>
  );
}

function GraficoAcumulado({ puntos }: { puntos: PuntoAcumulado[] }) {
  const puntoFinal = ({ cx, cy, index }: PuntoDelFinal) =>
    index === puntos.length - 1 ? (
      <circle
        key="final"
        cx={cx}
        cy={cy}
        r={6}
        fill={COLORES.actual}
        stroke="#ffffff"
        strokeWidth={3}
      />
    ) : (
      <g key={`punto-${index}`} />
    );
  return (
    <figure aria-label="Ventas por día" className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={puntos} margin={{ left: 0, right: 24, top: 8 }}>
          <defs>
            <linearGradient id="semanaActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={COLORES.actual} stopOpacity={0.25} />
              <stop offset="1" stopColor={COLORES.actual} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="etiqueta" {...EJE} tickLine={false} />
          <YAxis
            tickFormatter={pesosCortos}
            width={56}
            {...EJE}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip cursor={TOOLTIP_DE_LINEAS.cursor} content={<CartelDeSemana />} />
          <Legend iconType="circle" />
          <Area
            dataKey="actual"
            legendType="none"
            fill="url(#semanaActual)"
            stroke="none"
            isAnimationActive={false}
            tooltipType="none"
          />
          <Line
            name="Esta semana"
            dataKey="actual"
            stroke={COLORES.actual}
            strokeWidth={3.5}
            dot={puntoFinal}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
          <Line
            name="Semana anterior"
            dataKey="anterior"
            stroke={COLORES.anterior}
            strokeWidth={2.5}
            strokeDasharray="6 6"
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </figure>
  );
}
