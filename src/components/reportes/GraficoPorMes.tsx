'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatearPesos } from '@/lib/plata';
import { etiquetaDe } from '@/lib/reportes/agrupar';
import type { ResultadoDelMes } from '@/lib/reportes/resultado';

const pesos = (valor: unknown) => formatearPesos(Math.round(Number(valor)));

/** Ventas, gastos y resultado de cada mes; un mes sin gastos no tiene barra de resultado. */
export function GraficoPorMes({ datos }: { datos: ResultadoDelMes[] }) {
  const meses = datos.map((d) => ({ ...d, etiqueta: etiquetaDe(d.mes, 'mes') }));
  return (
    <figure aria-label="Gráfico por mes" className="bg-card h-72 rounded-xl border p-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={meses} margin={{ left: 8, right: 8 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="etiqueta" stroke="var(--muted-foreground)" fontSize={12} />
          <YAxis tickFormatter={pesos} width={90} stroke="var(--muted-foreground)" fontSize={12} />
          <Tooltip formatter={pesos} />
          <Legend />
          <Bar name="Ventas" dataKey="ventasCentavos" fill="var(--primary)" radius={4} />
          <Bar name="Gastos" dataKey="gastosCentavos" fill="var(--accent)" radius={4} />
          <Bar
            name="Resultado"
            dataKey="resultadoCentavos"
            fill="var(--muted-foreground)"
            radius={4}
          />
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
