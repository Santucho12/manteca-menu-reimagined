// Cada tarjeta de números con su color, como en FiestaCobra: lo que entra en verde, lo que sale o
// se anula en rojo, el balance en azul (Santiago, pedido 45) y el ticket en ámbar (pedido 101).
// Las clases van enteras para que Tailwind las encuentre.
type ColorDeTarjeta = { raya: string; icono: string };

const COLORES: Record<string, ColorDeTarjeta> = {
  Ventas: { raya: 'bg-emerald-500', icono: 'bg-emerald-50 text-emerald-600' },
  Cobrado: { raya: 'bg-emerald-500', icono: 'bg-emerald-50 text-emerald-600' },
  Gastos: { raya: 'bg-rose-500', icono: 'bg-rose-50 text-rose-600' },
  Anuladas: { raya: 'bg-rose-500', icono: 'bg-rose-50 text-rose-600' },
  Balance: { raya: 'bg-blue-500', icono: 'bg-blue-50 text-blue-600' },
  'Ticket promedio': { raya: 'bg-amber-500', icono: 'bg-amber-50 text-amber-600' },
  Canceladas: { raya: 'bg-slate-500', icono: 'bg-slate-50 text-slate-600' },
};

const DE_MARCA: ColorDeTarjeta = { raya: 'bg-primary', icono: 'bg-secondary text-primary' };

/** La raya de arriba y el cuadrado del ícono de una tarjeta, según su etiqueta. */
export function colorDeTarjeta(etiqueta: string): ColorDeTarjeta {
  return COLORES[etiqueta] ?? DE_MARCA;
}
