'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatearPesos } from '@/lib/plata';

const pesos = (valor: unknown) => formatearPesos(Math.round(Number(valor)));

/** Los diez primeros, de mayor a menor. */
export function GraficoDeBarras({ datos }: { datos: { nombre: string; montoCentavos: number }[] }) {
  const primeros = datos.slice(0, 10);
  return (
    <figure
      aria-label="Gráfico de los diez primeros"
      className="bg-card rounded-xl border p-2"
      style={{ height: 48 + primeros.length * 36 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={primeros} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid stroke="var(--border)" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={pesos}
            stroke="var(--muted-foreground)"
            fontSize={12}
          />
          <YAxis
            type="category"
            dataKey="nombre"
            width={120}
            stroke="var(--muted-foreground)"
            fontSize={12}
          />
          <Tooltip formatter={pesos} />
          <Bar name="Monto" dataKey="montoCentavos" fill="var(--primary)" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
