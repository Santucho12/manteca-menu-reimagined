export type Token = { nombre: string; variable: string };

export const COLORES: readonly Token[] = [
  { nombre: 'Fondo', variable: '--background' },
  { nombre: 'Texto', variable: '--foreground' },
  { nombre: 'Tarjeta', variable: '--card' },
  { nombre: 'Primario', variable: '--primary' },
  { nombre: 'Secundario', variable: '--secondary' },
  { nombre: 'Apagado', variable: '--muted' },
  { nombre: 'Texto apagado', variable: '--muted-foreground' },
  { nombre: 'Acento', variable: '--accent' },
  { nombre: 'Destructivo', variable: '--destructive' },
  { nombre: 'Borde', variable: '--border' },
];

export const TIPOGRAFIAS: readonly Token[] = [
  { nombre: 'Manic, para títulos', variable: '--font-family-title' },
  { nombre: 'Neufile Grotesk, para texto', variable: '--font-family-sans' },
];

export const RADIOS: readonly Token[] = [
  { nombre: 'Radio chico', variable: '--radio-chico' },
  { nombre: 'Radio medio', variable: '--radio-medio' },
  { nombre: 'Radio grande', variable: '--radio-grande' },
  { nombre: 'Radio extra grande', variable: '--radio-extra' },
];

export const SOMBRAS: readonly Token[] = [
  { nombre: 'Sombra suave', variable: '--sombra-suave' },
  { nombre: 'Sombra media', variable: '--sombra-media' },
  { nombre: 'Sombra alta', variable: '--sombra-alta' },
];

/** Pasos de la escala de Tailwind que usa la aplicacion (cada uno vale 0,25 rem). */
export const ESPACIADOS: readonly number[] = [1, 2, 3, 4, 6, 8, 12, 16];
