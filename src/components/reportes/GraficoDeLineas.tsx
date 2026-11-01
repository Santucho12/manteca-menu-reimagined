'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatearPesos } from '@/lib/plata';
import { pesosCortos } from '@/lib/reportes/ejeCorto';
import { TOOLTIP_DE_LINEAS } from './estiloDelTooltip';
import type { PuntoSuperpuesto } from '@/lib/reportes/agrupar';

const EJE = { stroke: '#94a3b8', fontSize: 10, fontWeight: 700 };
const pesos = (valor: unknown) => formatearPesos(Math.round(Number(valor)));
// Montos cortos en el eje ($4,5 M): con los largos el gráfico quedaba angosto en el celular.
const pesosDelEje = (valor: unknown) => pesosCortos(Number(valor));
// A la derecha, lugar para la mitad del último día: el eje lo centra en el borde y se cortaba.
const MARGEN = { left: 8, right: 20 };

/** El periodo y su comparacion uno sobre otro, posicion con posicion. */
export function GraficoDeLineas({ datos }: { datos: PuntoSuperpuesto[] }) {
  return (
    <figure
      aria-label="Gráfico del período"
      className="bg-card h-72 rounded-2xl shadow-card border border-border p-3 md:p-5"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={datos} margin={MARGEN}>
          <CartesianGrid stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="etiqueta" {...EJE} tickLine={false} />
          <YAxis
            tickFormatter={pesosDelEje}
            width={56}
            {...EJE}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip {...TOOLTIP_DE_LINEAS} formatter={pesos} />
          <Legend iconType="circle" />
          <Line
            name="Período"
            dataKey="actual"
            stroke="#bfa042"
            strokeWidth={3}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            name="Comparación"
            dataKey="comparacion"
            stroke="#94a3b8"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </figure>
  );
}
