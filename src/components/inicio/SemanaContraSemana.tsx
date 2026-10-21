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
import { Etiqueta, Panel } from '@/components/panel/Piezas';
import type { DiaDeLaSemana } from '@/lib/inicio/semana';

// La semana actual en azul y la anterior en gris: se ve de un vistazo cual es cual.
const COLORES = { actual: '#2563eb', anterior: '#94a3b8' };
const ventas = (valor: unknown) => `${valor} ${Number(valor) === 1 ? 'venta' : 'ventas'}`;

/** La cantidad de ventas de cada uno de los ultimos 7 dias, contra el mismo dia de la semana anterior. */
export function SemanaContraSemana({ datos }: { datos: DiaDeLaSemana[] }) {
  return (
    <Panel
      titulo="Últimos 7 días"
      etiqueta={
        <Etiqueta as="h2" id="ultimos-7-dias">
          Últimos 7 días
        </Etiqueta>
      }
    >
      <figure aria-label="Ventas por día" className="h-72 p-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={{ left: 0, right: 8 }} barGap={6} barCategoryGap="28%">
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="etiqueta" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis
              allowDecimals={false}
              width={36}
              stroke="var(--muted-foreground)"
              fontSize={12}
            />
            <Tooltip formatter={ventas} />
            <Legend />
            <Bar
              name="Últimos 7 días"
              dataKey="actual"
              fill={COLORES.actual}
              radius={4}
              isAnimationActive={false}
            />
            <Bar
              name="7 días anteriores"
              dataKey="anterior"
              fill={COLORES.anterior}
              radius={4}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </figure>
    </Panel>
  );
}
