/** Los iconos que se pueden elegir para una categoria. La base acepta exactamente estos. */
export const ICONOS = [
  '🥐',
  '🧈',
  '🍞',
  '🥨',
  '☕',
  '➕',
  '🥖',
  '🥯',
  '🍩',
  '🍪',
  '🧁',
  '🍰',
  '🥧',
  '🥪',
  '🍵',
  '🧃',
] as const;

export type Icono = (typeof ICONOS)[number];
