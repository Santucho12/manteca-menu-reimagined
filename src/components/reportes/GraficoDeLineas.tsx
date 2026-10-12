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

const pesos = (valor: unknown) => formatearPesos(Math.round(Number(valor)));

/** El periodo y su comparacion uno sobre otro, posicion con posicion. */
export function GraficoDeLineas({ datos }: { datos: PuntoSuperpuesto[] }) {
  return (
    <figure aria-label="Gráfico del período" className="bg-card h-72 rounded-xl border p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={datos} margin={{ left: 8, right: 8 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="etiqueta" stroke="var(--muted-foreground)" fontSize={12} />
          <YAxis tickFormatter={pesos} width={90} stroke="var(--muted-foreground)" fontSize={12} />
          <Tooltip formatter={pesos} />
          <Legend />
          <Line
            name="Período"
            dataKey="actual"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            name="Comparación"
            dataKey="comparacion"
            stroke="var(--muted-foreground)"
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
