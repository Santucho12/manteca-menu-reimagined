/** Un descuento en el cobro: porcentaje (10 es 10 %) o monto en pesos enteros (pedido 102). */
// total: el total final escrito a mano; se descuenta la diferencia (pedido 102).
export type Descuento = { tipo: 'porcentaje' | 'monto' | 'total'; valor: number };

/** Cuánto se descuenta del total, en centavos: nunca más que el total. La base hace la misma cuenta. */
export function descuentoEnCentavos(totalCentavos: number, descuento: Descuento | null): number {
  if (!descuento) return 0;
  const centavos =
    descuento.tipo === 'porcentaje'
      ? Math.round((totalCentavos * descuento.valor) / 100)
      : descuento.tipo === 'total'
        ? totalCentavos - descuento.valor * 100
        : descuento.valor * 100;
  return Math.min(totalCentavos, Math.max(0, centavos));
}

export type DescuentoConMotivo = Descuento & { motivo: string };
export type DescuentoEscrito = { tipo: Descuento['tipo']; valor: string; motivo: string };

/** Lo escrito en la pantalla, si ya es un descuento: un número entero y el motivo. */
export function descuentoEscrito(escrito: DescuentoEscrito): DescuentoConMotivo | null {
  const valor = Number(escrito.valor.replace(/\./g, ''));
  const motivo = escrito.motivo.trim();
  if (!Number.isInteger(valor) || valor <= 0 || motivo.length < 3) return null;
  return { tipo: escrito.tipo, valor, motivo };
}
