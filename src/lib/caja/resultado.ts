export const MEDIOS = ['efectivo', 'credito', 'debito', 'qr', 'transferencia'] as const;
export type Medio = (typeof MEDIOS)[number];
export type PorMedio = Record<Medio, number>;

export type CierreDeclarado = {
  fondoInicialCentavos: number;
  retirosCentavos: number;
  gastosCentavos: number;
  medios: PorMedio;
};
export type ResultadoDeMedio = {
  medio: Medio;
  declaradoCentavos: number;
  esperadoCentavos: number | null;
  diferenciaCentavos: number | null;
};
export type ResultadoDelCierre = {
  estado: 'esperando_ventas' | 'cierra' | 'con_diferencia';
  medios: ResultadoDeMedio[];
  diferenciaTotalCentavos: number | null;
};

// El efectivo arranca con el fondo y pierde lo que salio de la caja; el resto de los medios
// espera lo vendido con ese medio.
function esperadoDe(medio: Medio, declarado: CierreDeclarado, ventas: PorMedio): number {
  if (medio !== 'efectivo') return ventas[medio];
  return (
    declarado.fondoInicialCentavos +
    ventas.efectivo -
    declarado.retirosCentavos -
    declarado.gastosCentavos
  );
}

function medioDe(medio: Medio, declarado: CierreDeclarado, ventas: PorMedio | null) {
  const declaradoCentavos = declarado.medios[medio];
  const esperadoCentavos = ventas ? esperadoDe(medio, declarado, ventas) : null;
  const diferenciaCentavos =
    esperadoCentavos === null ? null : declaradoCentavos - esperadoCentavos;
  return { medio, declaradoCentavos, esperadoCentavos, diferenciaCentavos };
}

/**
 * Lo esperado, la diferencia y el estado de un cierre. Sin ventas del dia todavia, espera.
 * Diferencia negativa es faltante; positiva, sobrante. Cierra si ningun medio pasa la
 * tolerancia.
 */
export function resultadoDelCierre(
  declarado: CierreDeclarado,
  ventas: PorMedio | null,
  toleranciaCentavos: number,
): ResultadoDelCierre {
  const medios = MEDIOS.map((medio) => medioDe(medio, declarado, ventas));
  if (!ventas) return { estado: 'esperando_ventas', medios, diferenciaTotalCentavos: null };
  const diferencias = medios.map((medio) => medio.diferenciaCentavos ?? 0);
  const cierra = diferencias.every((diferencia) => Math.abs(diferencia) <= toleranciaCentavos);
  return {
    estado: cierra ? 'cierra' : 'con_diferencia',
    medios,
    diferenciaTotalCentavos: diferencias.reduce((suma, diferencia) => suma + diferencia, 0),
  };
}
