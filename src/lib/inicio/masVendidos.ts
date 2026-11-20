// Más vendidos rediseñado (Santiago, 2026-11-19, pedido 102): la barra compara cada producto con
// el primero y los tres primeros llevan su medalla dibujada. Las clases van enteras para Tailwind.
const MINIMO_VISIBLE = 4;

/** El ancho de la barra de un producto, en %, contra el que más dejó. */
export function anchoDeBarra(montoCentavos: number, primeroCentavos: number): number {
  if (primeroCentavos <= 0) return 0;
  return Math.max(MINIMO_VISIBLE, Math.round((montoCentavos / primeroCentavos) * 100));
}

// Los tres primeros llevan una medalla dibujada: la cinta, el disco y el número de su metal.
type Medalla = { nombre: string; disco: string; cinta: string; numero: string };
type Puesto = { medalla: Medalla | null; circulo: string };

const MEDALLAS: Medalla[] = [
  {
    nombre: 'Medalla de oro',
    disco: 'fill-amber-300 stroke-amber-500',
    cinta: 'fill-amber-500',
    numero: 'fill-amber-800',
  },
  {
    nombre: 'Medalla de plata',
    disco: 'fill-slate-200 stroke-slate-400',
    cinta: 'fill-slate-400',
    numero: 'fill-slate-700',
  },
  {
    nombre: 'Medalla de bronce',
    disco: 'fill-[#cd7f32] stroke-[#8c5523]',
    cinta: 'fill-[#a0522d]',
    numero: 'fill-[#3d200b]',
  },
];

const CIRCULO_GRIS = 'bg-slate-50 text-slate-400 border-slate-100';

/** El puesto: una medalla de oro, plata o bronce para los tres primeros; un círculo gris después. */
export function puestoDeMasVendidos(posicion: number): Puesto {
  return { medalla: MEDALLAS[posicion] ?? null, circulo: CIRCULO_GRIS };
}
