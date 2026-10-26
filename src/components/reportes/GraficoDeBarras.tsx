'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatearPesos } from '@/lib/plata';

const EJE = { stroke: '#94a3b8', fontSize: 10, fontWeight: 700 };
const pesos = (valor: unknown) => formatearPesos(Math.round(Number(valor)));

/** Los diez primeros, de mayor a menor, en el verde de la marca. */
export function GraficoDeBarras({ datos }: { datos: { nombre: string; montoCentavos: number }[] }) {
  const primeros = datos.slice(0, 10);
  return (
    <figure
      aria-label="Gráfico de los diez primeros"
      className="bg-card rounded-2xl shadow-card border border-border p-3 md:p-5"
      style={{ height: 72 + primeros.length * 36 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={primeros} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" tickFormatter={pesos} {...EJE} tickLine={false} />
          <YAxis type="category" dataKey="nombre" width={120} {...EJE} tickLine={false} />
          <Tooltip formatter={pesos} />
          <Bar
            name="Monto"
            dataKey="montoCentavos"
            fill="#1e3a8a"
            radius={[0, 6, 6, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
