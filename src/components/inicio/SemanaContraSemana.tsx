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
import type { DiaDeLaSemana } from '@/lib/inicio/semana';

// Los colores de Plan Reminder Pro: la semana actual en el verde de la marca y la anterior en gris.
const COLORES = { actual: '#bfa042', anterior: '#94a3b8' };
const EJE = { stroke: '#94a3b8', fontSize: 10, fontWeight: 700 };
const ventas = (valor: unknown) => `${valor} ${Number(valor) === 1 ? 'venta' : 'ventas'}`;

/** La cantidad de ventas de cada uno de los ultimos 7 dias, contra el mismo dia de la semana anterior. */
export function SemanaContraSemana({ datos }: { datos: DiaDeLaSemana[] }) {
  return (
    <section
      aria-label="Esta semana vs la anterior"
      className="rounded-2xl border border-border bg-card p-5 md:p-6"
    >
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
        Esta semana vs la anterior
      </p>
      <figure aria-label="Ventas por día" className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={{ left: 0, right: 8 }} barGap={6} barCategoryGap="28%">
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="etiqueta" {...EJE} tickLine={false} />
            <YAxis allowDecimals={false} width={36} {...EJE} tickLine={false} axisLine={false} />
            <Tooltip formatter={ventas} />
            <Legend />
            <Bar
              name="Esta semana"
              dataKey="actual"
              fill={COLORES.actual}
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
            <Bar
              name="Semana anterior"
              dataKey="anterior"
              fill={COLORES.anterior}
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </figure>
    </section>
  );
}
