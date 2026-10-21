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

// Un color distinto por serie y conocido (azul, rojo, verde): con los de la marca no se distinguian.
const COLORES = { ventas: '#2563eb', gastos: '#e11d48', resultado: '#059669' };

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
          <Bar
            name="Ventas"
            dataKey="ventasCentavos"
            fill={COLORES.ventas}
            radius={4}
            isAnimationActive={false}
          />
          <Bar
            name="Gastos"
            dataKey="gastosCentavos"
            fill={COLORES.gastos}
            radius={4}
            isAnimationActive={false}
          />
          <Bar
            name="Resultado"
            dataKey="resultadoCentavos"
            fill={COLORES.resultado}
            radius={4}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
