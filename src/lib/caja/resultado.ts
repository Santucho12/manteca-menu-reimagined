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
};
/** Sin las ventas del dia cargadas no hay contra que comparar: el cierre las espera. */
export type EstadoDelCierre = 'cierra' | 'con_diferencia' | 'esperando_ventas';
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

function medioDe(medio: Medio, declarado: CierreDeclarado, ventas: PorMedio): ResultadoDeMedio {
  const declaradoCentavos = declarado.medios[medio];
  const esperadoCentavos = esperadoDe(medio, declarado, ventas);
  return {
    medio,
    declaradoCentavos,
    esperadoCentavos,
    diferenciaCentavos: declaradoCentavos - esperadoCentavos,
  };
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
  const medios = MEDIOS.map((medio) => medioDe(medio, declarado, ventas));
  const cierra = medios.every((m) => Math.abs(m.diferenciaCentavos) <= toleranciaCentavos);
  return {
    estado: cierra ? 'cierra' : 'con_diferencia',
    medios,
    diferenciaTotalCentavos: medios.reduce((suma, m) => suma + m.diferenciaCentavos, 0),
  };
}
