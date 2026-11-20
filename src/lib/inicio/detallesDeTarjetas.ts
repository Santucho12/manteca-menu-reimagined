// Al pie de cada tarjeta de Inicio, qué muestra en pocas palabras, como en FiestaCobra. La
// variación contra el mes anterior ya no va en la tarjeta (Santiago, 2026-11-19, pedido 101).
const DETALLES: Record<string, string> = {
  Ventas: 'Cobrado del 1 a hoy',
  Gastos: 'Pagado del 1 a hoy',
  Balance: 'Ventas menos gastos',
  'Ticket promedio': 'Por venta cobrada',
};

/** La descripción al pie de una tarjeta de Inicio; vacía si no tiene. */
export function detalleDeTarjeta(etiqueta: string): string {
  return DETALLES[etiqueta] ?? '';
}
