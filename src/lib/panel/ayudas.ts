import { AYUDAS_DE_LA_BASE, type Ayuda, type ClaveDeAyuda } from './ayudasDeLaBase';
import { AYUDAS_DEL_NEGOCIO } from './ayudasDelNegocio';

export type { Ayuda, ClaveDeAyuda };

/** La explicacion de cada pantalla, en el lenguaje de quien la usa (el boton del encabezado). */
export const AYUDAS = { ...AYUDAS_DE_LA_BASE, ...AYUDAS_DEL_NEGOCIO } as Record<
  ClaveDeAyuda,
  Ayuda
>;
