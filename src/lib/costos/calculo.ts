export type EstadoDelCosto = 'ok' | 'sin_receta' | 'sin_unidades' | 'insumo_sin_precio';
export type Margenes = { objetivo: number; minimo: number };
export type CostoYPrecio = { costo: number | null; precio: number | null; estado: EstadoDelCosto };
export type FilaDeCosto = {
  costo: number | null;
  precio: number | null;
  ganancia: number | null;
  porcentaje: number | null;
  sugerido: number | null;
  debajo: boolean;
  motivo: string | null;
};

const MOTIVOS: Record<Exclude<EstadoDelCosto, 'ok'>, string> = {
  sin_receta: 'Falta la receta',
  sin_unidades: 'Faltan las unidades',
  insumo_sin_precio: 'Un insumo no tiene precio',
};
const CIEN_PESOS = 10_000;

/** El precio que deja el margen objetivo, redondeado hacia arriba a $100. Todo en enteros. */
export function precioSugerido(costoCentavos: number, objetivo: number): number {
  const dividendo = costoCentavos * 100;
  const divisor = (100 - objetivo) * CIEN_PESOS;
  return Math.floor((dividendo + divisor - 1) / divisor) * CIEN_PESOS;
}

function motivoDe({ costo, precio, estado }: CostoYPrecio): string | null {
  if (estado !== 'ok' || costo === null) return MOTIVOS[estado as keyof typeof MOTIVOS];
  return precio === null ? 'Sin precio en el menú' : null;
}

/** Costo, precio, ganancia en pesos y en porcentaje, sugerido y si quedo debajo del minimo. */
export function filaDeCosto(entrada: CostoYPrecio, margenes: Margenes): FilaDeCosto {
  const { costo, precio } = entrada;
  const conCosto = entrada.estado === 'ok' ? costo : null;
  const ganancia = conCosto !== null && precio !== null ? precio - conCosto : null;
  // Se compara en enteros: ganancia / precio < minimo / 100.
  const debajo = ganancia !== null && precio! > 0 && ganancia * 100 < margenes.minimo * precio!;
  return {
    costo: conCosto,
    precio,
    ganancia,
    porcentaje: ganancia !== null && precio! > 0 ? (ganancia * 100) / precio! : null,
    sugerido: conCosto === null ? null : precioSugerido(conCosto, margenes.objetivo),
    debajo,
    motivo: motivoDe(entrada),
  };
}

/** Un porcentaje como se lee: 65 %, o 33,3 % si tiene decimales. */
export function textoDelPorcentaje(porcentaje: number): string {
  const redondeado = Math.round(porcentaje * 10) / 10;
  return `${String(redondeado).replace('.', ',')} %`;
}
