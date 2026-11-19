export type CierreParaFondo = {
  id: string;
  fecha: string;
  anulado: boolean;
  queda_en_caja_centavos: number;
  /** 1 es el Mediodia y 2 la Noche; sin turno, la Noche. */
  turno?: number;
};

// La Noche va despues del Mediodia del mismo dia.
const orden = (cierre: CierreParaFondo) => `${cierre.fecha}|${cierre.turno ?? 2}`;

const ultimoAntesDe = (ordenados: CierreParaFondo[], cierre: CierreParaFondo) =>
  ordenados.filter((otro) => orden(otro) < orden(cierre)).at(-1);

/**
 * Lo que quedo en la caja en el ultimo cierre no anulado de un turno anterior, para cada cierre:
 * la regla de cierres_fondos_anteriores en la base, calculada con los cierres del rango para no
 * esperar otra tanda. Si no hay uno en el rango, vale lo que quedo antes del rango.
 */
export function fondosAnterioresDe(
  cierres: CierreParaFondo[],
  antesDelRangoCentavos: number | null,
): Map<string, number | null> {
  const validos = cierres
    .filter((cierre) => !cierre.anulado)
    .sort((a, b) => orden(a).localeCompare(orden(b)));
  return new Map(
    cierres.map((cierre) => {
      const anterior = ultimoAntesDe(validos, cierre);
      return [cierre.id, anterior ? anterior.queda_en_caja_centavos : antesDelRangoCentavos];
    }),
  );
}
