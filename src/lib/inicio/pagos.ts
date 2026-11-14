import { sumarDias } from '../reportes/periodos';

export type PagosParaAvisar = {
  vencidos: number;
  estaSemana: number;
  /** La clave del pago, si en total es uno solo: el aviso lleva a pagarlo. */
  unico: string | null;
};

/** De los próximos pagos de Gastos, cuántos están vencidos y cuántos vencen de hoy a 6 días. */
export function pagosParaAvisar(
  items: { clave: string; fecha: string }[],
  hoy: string,
): PagosParaAvisar {
  const hasta = sumarDias(hoy, 6);
  const vencidos = items.filter((pago) => pago.fecha < hoy);
  const estaSemana = items.filter((pago) => pago.fecha >= hoy && pago.fecha <= hasta);
  const [primero, ...resto] = [...vencidos, ...estaSemana];
  return {
    vencidos: vencidos.length,
    estaSemana: estaSemana.length,
    unico: primero && resto.length === 0 ? primero.clave : null,
  };
}
