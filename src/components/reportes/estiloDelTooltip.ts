import type { CSSProperties } from 'react';

// El cartel que sale al pasar el mouse por un gráfico: el mismo en todos, con los colores del panel.
const contentStyle: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e0e4eb',
  borderRadius: 14,
  boxShadow: '0 12px 28px -8px rgba(15, 23, 42, 0.18)',
  padding: '10px 14px',
};
const labelStyle: CSSProperties = {
  color: '#121b2b',
  fontSize: 12,
  fontWeight: 800,
  marginBottom: 6,
};
const itemStyle: CSSProperties = { fontSize: 12, fontWeight: 700, padding: '2px 0' };

export const TOOLTIP = { contentStyle, labelStyle, itemStyle, separator: ': ' } as const;

/** Barras y torta: en lugar del bloque gris, un resalte suave del color de marca. */
export const TOOLTIP_DE_BARRAS = { ...TOOLTIP, cursor: { fill: 'rgba(15, 23, 42, 0.05)' } };

/** Líneas: la guía vertical, fina y en el color del borde. */
export const TOOLTIP_DE_LINEAS = { ...TOOLTIP, cursor: { stroke: '#cbd5e1', strokeWidth: 1 } };
