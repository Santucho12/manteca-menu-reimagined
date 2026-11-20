// Cada reporte con su color, por lo que muestra y no por su puesto: lo que entra en verde, lo que
// sale en rojo, y el resto con un color propio. El azul queda para la marca (pedido 101).
export const COLOR_DE_REPORTE = {
  ventas: '#10b981',
  productos: '#10b981',
  gastos: '#f43f5e',
  gastosPorPeriodo: '#f43f5e',
  categorias: '#8b5cf6',
  tipos: '#f59e0b',
  caja: '#0ea5e9',
} as const;

/** La línea del período con el que se compara: gris y punteada, para que no compita. */
export const COLOR_DE_COMPARACION = '#94a3b8';
