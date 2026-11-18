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
  esperadoCentavos: number;
  diferenciaCentavos: number;
  /** La diferencia pasa la tolerancia: este medio hace que el cierre no cierre. */
  fuera: boolean;
};
/** Sin las ventas del dia cargadas no hay contra que comparar: el cierre las espera. */
export type EstadoDelCierre = 'cierra' | 'con_diferencia';
export type ResultadoDelCierre = {
  estado: EstadoDelCierre;
  medios: ResultadoDeMedio[];
  diferenciaTotalCentavos: number;
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

function medioDe(
  medio: Medio,
  declarado: CierreDeclarado,
  ventas: PorMedio,
  toleranciaCentavos: number,
): ResultadoDeMedio {
  const declaradoCentavos = declarado.medios[medio];
  const esperadoCentavos = esperadoDe(medio, declarado, ventas);
  const diferenciaCentavos = declaradoCentavos - esperadoCentavos;
  const fuera = Math.abs(diferenciaCentavos) > toleranciaCentavos;
  return { medio, declaradoCentavos, esperadoCentavos, diferenciaCentavos, fuera };
}

/**
 * Lo esperado, la diferencia y el estado de un cierre contra las ventas del dia (que pueden ser
 * cero). Diferencia negativa es faltante; positiva, sobrante. Cierra si ningun medio pasa la
 * tolerancia.
 */
export function resultadoDelCierre(
  declarado: CierreDeclarado,
  ventas: PorMedio,
  toleranciaCentavos: number,
): ResultadoDelCierre {
  const medios = MEDIOS.map((medio) => medioDe(medio, declarado, ventas, toleranciaCentavos));
  return {
    estado: medios.some((m) => m.fuera) ? 'con_diferencia' : 'cierra',
    medios,
    diferenciaTotalCentavos: medios.reduce((suma, m) => suma + m.diferenciaCentavos, 0),
  };
}
