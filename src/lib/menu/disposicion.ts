/**
 * Cómo se acomodan los precios en la tarjeta de un producto de la carta. Van al costado del nombre
 * si la tarjeta tiene lugar para el nombre y todos sus precios; si no, debajo, en columnas parejas
 * y separados por una línea. Con tres precios propios en la grilla de dos columnas no entraban:
 * aplastaban el nombre y se metían en la tarjeta de al lado (pedido 81).
 *
 * El ancho lo mide la propia tarjeta (`@container`), no la pantalla: vale igual en el celular y en
 * la computadora. Las clases van escritas enteras para que Tailwind las encuentre.
 */
export type DisposicionDePrecios = { fila: string; precios: string };

const AL_COSTADO: DisposicionDePrecios = {
  fila: 'flex-row items-center justify-between',
  precios: 'flex shrink-0 justify-end gap-4 text-right sm:gap-6',
};

// El ancho que piden el nombre (unos 9rem) y los precios, según cuántos son.
const SEGUN_CUANTOS: Record<2 | 3 | 4, DisposicionDePrecios> = {
  2: {
    fila: 'flex-col @min-[19rem]:flex-row @min-[19rem]:items-center @min-[19rem]:justify-between',
    precios:
      'grid grid-flow-col auto-cols-fr gap-2 border-t border-border pt-3 text-center @min-[19rem]:flex @min-[19rem]:shrink-0 @min-[19rem]:justify-end @min-[19rem]:gap-6 @min-[19rem]:border-t-0 @min-[19rem]:pt-0 @min-[19rem]:text-right',
  },
  3: {
    fila: 'flex-col @min-[26rem]:flex-row @min-[26rem]:items-center @min-[26rem]:justify-between',
    precios:
      'grid grid-flow-col auto-cols-fr gap-2 border-t border-border pt-3 text-center @min-[26rem]:flex @min-[26rem]:shrink-0 @min-[26rem]:justify-end @min-[26rem]:gap-6 @min-[26rem]:border-t-0 @min-[26rem]:pt-0 @min-[26rem]:text-right',
  },
  4: {
    fila: 'flex-col @min-[32rem]:flex-row @min-[32rem]:items-center @min-[32rem]:justify-between',
    precios:
      'grid grid-flow-col auto-cols-fr gap-2 border-t border-border pt-3 text-center @min-[32rem]:flex @min-[32rem]:shrink-0 @min-[32rem]:justify-end @min-[32rem]:gap-6 @min-[32rem]:border-t-0 @min-[32rem]:pt-0 @min-[32rem]:text-right',
  },
};

export function disposicionDePrecios(cantidad: number): DisposicionDePrecios {
  if (cantidad < 2) return AL_COSTADO;
  return SEGUN_CUANTOS[Math.min(cantidad, 4) as 2 | 3 | 4];
}
