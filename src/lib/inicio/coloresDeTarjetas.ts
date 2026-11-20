// Cada tarjeta de números con su color, como en FiestaCobra: el borde y el cuadrado del ícono
// teñidos, sin raya arriba. Lo que entra en verde, lo que sale o se anula en rojo, el balance en
// azul (Santiago, pedido 45) y el ticket en gris, que es neutro (pedido 102). Las clases van enteras para que
// Tailwind las encuentre.
type ColorDeTarjeta = { borde: string; icono: string; punto: string };

const COLORES: Record<string, ColorDeTarjeta> = {
  Ventas: {
    borde: 'border-emerald-100',
    icono: 'bg-emerald-50 text-emerald-600',
    punto: 'bg-emerald-600',
  },
  Cobrado: {
    borde: 'border-emerald-100',
    icono: 'bg-emerald-50 text-emerald-600',
    punto: 'bg-emerald-600',
  },
  Gastos: { borde: 'border-rose-100', icono: 'bg-rose-50 text-rose-600', punto: 'bg-rose-600' },
  Anuladas: { borde: 'border-rose-100', icono: 'bg-rose-50 text-rose-600', punto: 'bg-rose-600' },
  Balance: { borde: 'border-blue-100', icono: 'bg-blue-50 text-blue-600', punto: 'bg-blue-600' },
  'Ticket promedio': {
    borde: 'border-slate-100',
    icono: 'bg-slate-50 text-slate-600',
    punto: 'bg-slate-600',
  },
  Canceladas: {
    borde: 'border-slate-100',
    icono: 'bg-slate-50 text-slate-600',
    punto: 'bg-slate-600',
  },
};

const NEUTRO: ColorDeTarjeta = {
  borde: 'border-slate-100',
  icono: 'bg-slate-50 text-slate-600',
  punto: 'bg-slate-600',
};

/** El borde de una tarjeta, el cuadrado de su ícono y el punto del pie, según su etiqueta. */
export function colorDeTarjeta(etiqueta: string): ColorDeTarjeta {
  return COLORES[etiqueta] ?? NEUTRO;
}
