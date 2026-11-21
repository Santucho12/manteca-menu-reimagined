type ColorDeTema = { titulo: string; punto: string; raya: string };

// Los colores de la regla de Inicio, en ronda: los temas de cada ayuda se distinguen a simple vista.
const COLORES: ColorDeTema[] = [
  { titulo: 'text-blue-700', punto: 'bg-blue-500', raya: 'bg-blue-500' },
  { titulo: 'text-emerald-700', punto: 'bg-emerald-500', raya: 'bg-emerald-500' },
  { titulo: 'text-rose-700', punto: 'bg-rose-500', raya: 'bg-rose-500' },
  { titulo: 'text-blue-700', punto: 'bg-blue-500', raya: 'bg-blue-500' },
];

export const colorDeTema = (indice: number): ColorDeTema =>
  COLORES[indice % COLORES.length] ?? COLORES[0]!;
