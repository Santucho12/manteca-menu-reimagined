import { TOOLTIP } from '@/components/reportes/estiloDelTooltip';
import type { PuntoAcumulado } from '@/lib/inicio/semanaAcumulada';

type Props = { active?: boolean; payload?: { payload: PuntoAcumulado }[] };

const AZUL = '#2563eb';
const ROJO = '#f43f5e';

type FilaProps = { color: string; nombre: string; cantidad: number };

function Fila({ color, nombre, cantidad }: FilaProps) {
  return (
    <div className="flex items-center gap-2 py-0.5 text-xs">
      <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="flex-1 font-semibold text-muted-foreground">{nombre}</span>
      <span className="font-bold text-foreground">{cantidad}</span>
    </div>
  );
}

function Bloque({ titulo, esta, anterior }: { titulo: string; esta: number; anterior: number }) {
  return (
    <div className="mt-2.5">
      <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {titulo}
      </p>
      <Fila color={AZUL} nombre="Esta semana" cantidad={esta} />
      <Fila color={ROJO} nombre="Semana pasada" cantidad={anterior} />
    </div>
  );
}

/** El cartelito del gráfico: ventas de ese día y ventas sumadas hasta ese día, en las dos semanas. */
export function CartelDeSemana({ active, payload }: Props) {
  const punto = payload?.[0]?.payload;
  if (!active || !punto) return null;
  return (
    <div style={TOOLTIP.contentStyle} className="min-w-48">
      <p style={{ ...TOOLTIP.labelStyle, marginBottom: 0 }}>{punto.etiqueta}</p>
      <Bloque titulo="Ventas ese día" esta={punto.delDia} anterior={punto.delDiaAnterior} />
      <Bloque titulo="Ventas hasta ese día" esta={punto.actual} anterior={punto.anterior} />
    </div>
  );
}
