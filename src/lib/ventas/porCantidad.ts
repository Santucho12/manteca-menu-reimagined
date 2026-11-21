import { formatearPesos } from '../plata';

type Renglon = {
  id: string;
  cantidad: number;
  precio_unitario_centavos: number;
  subtotal_centavos: number;
};

/**
 * Los renglones que se cobraron por cantidad (la docena variada): su subtotal no es cantidad por
 * precio, porque lleva su parte del precio de la docena. El detalle los muestra juntos.
 */
export function precioPorCantidad(renglones: Renglon[]) {
  const marcados = renglones.filter(
    (r) => Math.round(r.cantidad * r.precio_unitario_centavos) !== r.subtotal_centavos,
  );
  const suelto = marcados.reduce(
    (s, r) => s + Math.round(r.cantidad * r.precio_unitario_centavos),
    0,
  );
  const cobradoCentavos = marcados.reduce((s, r) => s + r.subtotal_centavos, 0);
  return {
    ids: new Set(marcados.map((r) => r.id)),
    cobradoCentavos,
    ahorroCentavos: suelto - cobradoCentavos,
  };
}

/** Cómo se lee un descuento: "10 % de descuento ($1.444,00)" o "Descuento fijo de $1.800,00". */
export function textoDelDescuento(
  centavos: number,
  porcentaje: number | null | undefined,
  tipo?: string | null,
): string {
  if (tipo === 'total') return `Total cambiado a mano (−${formatearPesos(centavos)})`;
  return porcentaje
    ? `${porcentaje} % de descuento (${formatearPesos(centavos)})`
    : `Descuento fijo de ${formatearPesos(centavos)}`;
}
