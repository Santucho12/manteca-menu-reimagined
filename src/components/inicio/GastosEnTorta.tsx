'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { EnlaceASeccion } from '@/components/panel/EnlaceASeccion';
import { rebanadasDeGastos } from '@/lib/inicio/gastosEnTorta';
import { formatearPesos } from '@/lib/plata';
import { TOOLTIP } from '@/components/reportes/estiloDelTooltip';
import { EncabezadoDeTarjeta } from './EncabezadoDeTarjeta';
import type { GastoDelDia } from '@/lib/reportes/gastos';
import { SOMBRA_DE_INICIO } from './sombraDeInicio';

// Los colores vivos de "Mes a mes" (verde, azul y rojo), el celeste, el ambar y el violeta para el resto.
const COLORES = ['#10b981', '#0ea5e9', '#f43f5e', '#f59e0b', '#8b5cf6'];

const pesos = (valor: unknown) => formatearPesos(Math.round(Number(valor)));

/** En que se fue la plata del mes: cada categoria con su parte del gasto. */
export function GastosEnTorta({ gastos }: { gastos: GastoDelDia[] }) {
  const rebanadas = rebanadasDeGastos(gastos);
  return (
    <section
      aria-label="Gastos del mes"
      className={`h-full rounded-2xl border border-border bg-card p-6 md:p-8 ${SOMBRA_DE_INICIO}`}
    >
      <EncabezadoDeTarjeta
        titulo="Gastos por categoría"
        descripcion="En qué se fue la plata del mes."
      >
        <EnlaceASeccion clave="gastos" seccion="Gastos" href="/admin/gastos" texto="Ver gastos" />
      </EncabezadoDeTarjeta>
      {rebanadas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay gastos este mes.</p>
      ) : (
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <figure aria-label="Gastos por categoría" className="h-56 w-56 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rebanadas}
                  dataKey="montoCentavos"
                  nameKey="nombre"
                  outerRadius="100%"
                  stroke="#ffffff"
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  {rebanadas.map((r, i) => (
                    <Cell key={r.clave} fill={COLORES[i % COLORES.length]} />
                  ))}
                </Pie>
                <Tooltip {...TOOLTIP} formatter={pesos} />
              </PieChart>
            </ResponsiveContainer>
          </figure>
          <ul aria-label="Gastos por categoría" className="w-full flex-1 min-w-0 space-y-4">
            {rebanadas.map((r, i) => (
              <li key={r.clave} className="flex items-center gap-2 text-sm">
                <span
                  aria-hidden="true"
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ background: COLORES[i % COLORES.length] }}
                />
                <span className="flex-1 min-w-0 wrap-break-word font-semibold">{r.nombre}</span>
                <span className="font-bold tabular-nums">
                  {String(r.porcentaje).replace('.', ',')} %
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
