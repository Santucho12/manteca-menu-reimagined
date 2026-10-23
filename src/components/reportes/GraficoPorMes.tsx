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

// Una serie por color, de la paleta de Plan Reminder Pro: ventas en el verde de la marca, gastos
// en rosa y balance en azul.
const COLORES = { ventas: '#10b981', gastos: '#f43f5e', resultado: '#3b82f6' };
const EJE = { stroke: '#94a3b8', fontSize: 10, fontWeight: 700 };

const pesos = (valor: unknown) => formatearPesos(Math.round(Number(valor)));

/** Ventas, gastos y resultado de cada mes; un mes sin gastos no tiene barra de resultado. */
export function GraficoPorMes({ datos }: { datos: ResultadoDelMes[] }) {
  const meses = datos.map((d) => ({ ...d, etiqueta: etiquetaDe(d.mes, 'mes') }));
  return (
    <figure aria-label="Gráfico por mes" className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={meses} margin={{ left: 8, right: 8 }} barGap={6} barCategoryGap="28%">
          <CartesianGrid stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="etiqueta" {...EJE} tickLine={false} />
          <YAxis tickFormatter={pesos} width={90} {...EJE} tickLine={false} axisLine={false} />
          <Tooltip formatter={pesos} />
          <Legend />
          <Bar
            name="Ventas"
            dataKey="ventasCentavos"
            fill={COLORES.ventas}
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            name="Gastos"
            dataKey="gastosCentavos"
            fill={COLORES.gastos}
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            name="Resultado"
            dataKey="resultadoCentavos"
            fill={COLORES.resultado}
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
