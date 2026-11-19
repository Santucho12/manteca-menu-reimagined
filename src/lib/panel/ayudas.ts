import { AYUDAS_DE_LA_BASE, type Ayuda, type ClaveDeAyuda } from './ayudasDeLaBase';
import { AYUDAS_DE_COMPRAS } from './ayudasDeCompras';
import { AYUDAS_DE_CONTROL } from './ayudasDeControl';
import { AYUDAS_DEL_NEGOCIO } from './ayudasDelNegocio';

export type { Ayuda, ClaveDeAyuda };

/** La explicacion de cada pantalla, en el lenguaje de quien la usa (el boton del encabezado). */
export const AYUDAS = {
  ...AYUDAS_DE_LA_BASE,
  ...AYUDAS_DE_COMPRAS,
  ...AYUDAS_DEL_NEGOCIO,
  ...AYUDAS_DE_CONTROL,
} as Record<ClaveDeAyuda, Ayuda>;
