export type CierreParaFondo = {
  id: string;
  fecha: string;
  anulado: boolean;
  queda_en_caja_centavos: number;
};

const ultimoAntesDe = (ordenados: CierreParaFondo[], fecha: string) =>
  ordenados.filter((cierre) => cierre.fecha < fecha).at(-1);

/**
 * Lo que quedo en la caja en el ultimo cierre no anulado de una fecha anterior, para cada cierre:
 * la regla de cierres_fondos_anteriores en la base, calculada con los cierres del rango para no
 * esperar otra tanda. Si no hay uno en el rango, vale lo que quedo antes del rango.
 */
export function fondosAnterioresDe(
  cierres: CierreParaFondo[],
  antesDelRangoCentavos: number | null,
): Map<string, number | null> {
  const validos = cierres
    .filter((cierre) => !cierre.anulado)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  return new Map(
    cierres.map((cierre) => {
      const anterior = ultimoAntesDe(validos, cierre.fecha);
      return [cierre.id, anterior ? anterior.queda_en_caja_centavos : antesDelRangoCentavos];
    }),
  );
}
