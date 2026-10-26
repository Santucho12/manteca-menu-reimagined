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
import type { PuntoSuperpuesto } from '@/lib/reportes/agrupar';

const EJE = { stroke: '#94a3b8', fontSize: 10, fontWeight: 700 };
const pesos = (valor: unknown) => formatearPesos(Math.round(Number(valor)));

/** El periodo y su comparacion uno sobre otro, posicion con posicion. */
export function GraficoDeLineas({ datos }: { datos: PuntoSuperpuesto[] }) {
  return (
    <figure
      aria-label="Gráfico del período"
      className="bg-card h-72 rounded-2xl shadow-card border border-border p-3 md:p-5"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={datos} margin={{ left: 8, right: 8 }}>
          <CartesianGrid stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="etiqueta" {...EJE} tickLine={false} />
          <YAxis tickFormatter={pesos} width={90} {...EJE} tickLine={false} axisLine={false} />
          <Tooltip formatter={pesos} />
          <Legend />
          <Line
            name="Período"
            dataKey="actual"
            stroke="#1e3a8a"
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
