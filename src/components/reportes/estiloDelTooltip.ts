import type { CSSProperties } from 'react';

// El cartel que sale al pasar el mouse por un gráfico: el mismo en todos, con los colores del panel.
const contentStyle: CSSProperties = {
  background: '#fbf9f3',
  border: '1px solid #e6dcc8',
  borderRadius: 14,
  boxShadow: '0 12px 28px -8px rgba(43, 29, 20, 0.22)',
  padding: '10px 14px',
};
const labelStyle: CSSProperties = {
  color: '#2b1d14',
  fontSize: 12,
  fontWeight: 800,
  marginBottom: 6,
};
const itemStyle: CSSProperties = { fontSize: 12, fontWeight: 700, padding: '2px 0' };

export const TOOLTIP = { contentStyle, labelStyle, itemStyle, separator: ': ' } as const;

/** Barras y torta: en lugar del bloque gris, un resalte suave del dorado del panel. */
export const TOOLTIP_DE_BARRAS = { ...TOOLTIP, cursor: { fill: 'rgba(191, 160, 66, 0.12)' } };

/** Líneas: la guía vertical, fina y en el color del borde. */
export const TOOLTIP_DE_LINEAS = { ...TOOLTIP, cursor: { stroke: '#d8cdb6', strokeWidth: 1 } };
