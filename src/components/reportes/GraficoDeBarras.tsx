'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatearPesos } from '@/lib/plata';
import { pesosCortos } from '@/lib/reportes/ejeCorto';
import { TOOLTIP_DE_BARRAS } from './estiloDelTooltip';

const EJE = { stroke: '#94a3b8', fontSize: 10, fontWeight: 700 };
const pesos = (valor: unknown) => formatearPesos(Math.round(Number(valor)));
// El eje orienta con montos cortos ($12 M): los largos no entraban y el último se cortaba en el
// borde. El monto exacto está en la ventanita.
const pesosDelEje = (valor: unknown) => pesosCortos(Number(valor));

type Props = {
  datos: { nombre: string; montoCentavos: number }[];
  etiqueta?: string;
  /** Cuántas barras dibuja; por defecto, las diez primeras. */
  limite?: number;
  altoDeBarra?: number;
  /** El color del reporte (`COLOR_DE_REPORTE`). */
  color: string;
};

/** Las primeras barras, de mayor a menor, en el color del reporte. */
export function GraficoDeBarras({
  datos,
  etiqueta = 'Gráfico de los diez primeros',
  limite = 10,
  altoDeBarra = 36,
  color,
}: Props) {
  const primeros = datos.slice(0, limite);
  return (
    <figure
      aria-label={etiqueta}
      className="bg-card rounded-2xl shadow-card border border-border p-3 md:p-5"
      style={{ height: 72 + primeros.length * altoDeBarra }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={primeros} layout="vertical" margin={{ left: 8, right: 24 }}>
          <CartesianGrid stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" tickFormatter={pesosDelEje} {...EJE} tickLine={false} />
          <YAxis type="category" dataKey="nombre" width={120} {...EJE} tickLine={false} />
          <Tooltip {...TOOLTIP_DE_BARRAS} formatter={pesos} />
          <Bar
            name="Monto"
            dataKey="montoCentavos"
            fill={color}
            radius={[0, 6, 6, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
