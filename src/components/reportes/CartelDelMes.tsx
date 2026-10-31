import { formatearPesos } from '@/lib/plata';
import { TOOLTIP } from './estiloDelTooltip';

type Serie = { name?: string; value?: unknown; color?: string };
type Props = {
  active?: boolean;
  payload?: Serie[];
  label?: unknown;
  titulo: (etiqueta: unknown) => string;
};

/** La ventanita del mes a mes: el mes y cada serie con su punto y su monto. */
export function CartelDelMes({ active, payload, label, titulo }: Props) {
  if (!active || !payload?.length) return null;
  return (
    <div data-testid="ventanita-del-mes" style={TOOLTIP.contentStyle} className="min-w-44">
      <p style={{ ...TOOLTIP.labelStyle, marginBottom: 4 }}>{titulo(label)}</p>
      <ul>
        {payload.map((serie) => (
          <li key={serie.name} className="flex items-center gap-2 py-0.5 text-xs">
            <span
              aria-hidden="true"
              data-testid="punto-de-serie"
              className="h-2 w-2 rounded-full"
              style={{ background: serie.color }}
            />
            <span className="flex-1 font-semibold text-muted-foreground">{serie.name}</span>
            <span className="font-bold text-foreground">
              {formatearPesos(Math.round(Number(serie.value)))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
