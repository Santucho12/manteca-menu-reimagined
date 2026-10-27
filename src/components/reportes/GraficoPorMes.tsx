'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatearPesos } from '@/lib/plata';
import { etiquetaDe } from '@/lib/reportes/agrupar';
import type { ResultadoDelMes } from '@/lib/reportes/resultado';

// Los mismos colores que las tarjetas de Inicio: ventas en verde, gastos en rojo y resultado
// (el balance) en azul (Santiago, 2026-10-26).
const COLORES = { ventas: '#10b981', gastos: '#f43f5e', resultado: '#3b82f6' };
const EJE = { stroke: '#94a3b8', fontSize: 10, fontWeight: 700 };
// El mes en curso va más claro: todavía no terminó y no se tiene que leer como una caída.
const OPACIDAD_EN_CURSO = 0.45;

const pesos = (valor: unknown) => formatearPesos(Math.round(Number(valor)));

type Props = { datos: ResultadoDelMes[]; alto?: string; mesEnCurso?: string };
type PropsDelTick = { x?: number; y?: number; payload?: { value: string }; enCurso: string | null };

/** La etiqueta de cada mes; debajo del mes que todavía no terminó, "en curso". */
function TickDelMes({ x = 0, y = 0, payload, enCurso }: PropsDelTick) {
  const etiqueta = payload?.value ?? '';
  return (
    <g transform={`translate(${x},${y})`}>
      <text dy={12} textAnchor="middle" fill={EJE.stroke} fontSize={10} fontWeight={700}>
        {etiqueta}
      </text>
      {etiqueta === enCurso ? (
        <text dy={25} textAnchor="middle" fill="#8a7330" fontSize={9} fontWeight={700}>
          en curso
        </text>
      ) : null}
    </g>
  );
}

/** Ventas, gastos y resultado de cada mes; un mes sin gastos no tiene barra de resultado. */
export function GraficoPorMes({ datos, alto = 'h-72', mesEnCurso }: Props) {
  const meses = datos.map((d) => ({ ...d, etiqueta: etiquetaDe(d.mes, 'mes') }));
  const enCurso = mesEnCurso ? etiquetaDe(mesEnCurso, 'mes') : null;
  const celdas = () =>
    meses.map((m) => (
      <Cell key={m.mes} fillOpacity={m.mes === mesEnCurso ? OPACIDAD_EN_CURSO : 1} />
    ));
  const titulo = (etiqueta: unknown) =>
    etiqueta === enCurso ? `${etiqueta} · en curso, del 1 a hoy` : String(etiqueta);
  return (
    <figure aria-label="Gráfico por mes" className={alto}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={meses} margin={{ left: 8, right: 8 }} barGap={6} barCategoryGap="28%">
          <CartesianGrid stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="etiqueta"
            {...EJE}
            height={enCurso ? 36 : 30}
            tickLine={false}
            tick={<TickDelMes enCurso={enCurso} />}
          />
          <YAxis tickFormatter={pesos} width={90} {...EJE} tickLine={false} axisLine={false} />
          <Tooltip formatter={pesos} labelFormatter={titulo} />
          <Legend iconType="circle" />
          <Bar
            name="Ventas"
            dataKey="ventasCentavos"
            fill={COLORES.ventas}
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          >
            {celdas()}
          </Bar>
          <Bar
            name="Gastos"
            dataKey="gastosCentavos"
            fill={COLORES.gastos}
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          >
            {celdas()}
          </Bar>
          <Bar
            name="Balance"
            dataKey="resultadoCentavos"
            fill={COLORES.resultado}
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          >
            {celdas()}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
