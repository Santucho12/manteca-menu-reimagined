import { variacion, type Variacion } from './comparacion';
import { gastosPorCategoria, totalDeGastos, type FilaDeGasto, type GastoDelDia } from './gastos';
import type { VentaDelDia } from './ventas';

export type ResultadoDelPeriodo = {
  ventasCentavos: number;
  gastosCentavos: number;
  /** Nulo sin gastos cargados: un mes de antes del sistema tiene ventas pero no gastos. */
  resultadoCentavos: number | null;
  categorias: FilaDeGasto[];
};
export type ResultadoDelMes = {
  mes: string;
  ventasCentavos: number;
  gastosCentavos: number;
  resultadoCentavos: number | null;
};

const totalDeVentas = (dias: VentaDelDia[]) => dias.reduce((s, d) => s + d.monto_centavos, 0);

export function resultadoDelPeriodo(
  dias: VentaDelDia[],
  gastos: GastoDelDia[],
): ResultadoDelPeriodo {
  const ventasCentavos = totalDeVentas(dias);
  const gastosCentavos = totalDeGastos(gastos);
  return {
    ventasCentavos,
    gastosCentavos,
    resultadoCentavos: gastos.length === 0 ? null : ventasCentavos - gastosCentavos,
    categorias: gastosPorCategoria(gastos),
  };
}

function mesesDe(dias: VentaDelDia[], gastos: GastoDelDia[]): string[] {
  const fechas = [...dias.map((d) => d.dia), ...gastos.map((g) => g.dia)];
  return [...new Set(fechas.map((fecha) => fecha.slice(0, 7)))].sort();
}

export function resultadoPorMes(dias: VentaDelDia[], gastos: GastoDelDia[]): ResultadoDelMes[] {
  return mesesDe(dias, gastos).map((mes) => {
    const { ventasCentavos, gastosCentavos, resultadoCentavos } = resultadoDelPeriodo(
      dias.filter((d) => d.dia.startsWith(mes)),
      gastos.filter((g) => g.dia.startsWith(mes)),
    );
    return { mes, ventasCentavos, gastosCentavos, resultadoCentavos };
  });
}

export type ComparacionDelResultado = {
  ventas: Variacion;
  gastos: Variacion;
  resultado: Variacion;
};

/** Sin gastos del otro periodo, gastos y resultado no comparan: faltaba cargarlos. */
export function comparacionDelResultado(
  actual: ResultadoDelPeriodo,
  anterior: ResultadoDelPeriodo | null,
): ComparacionDelResultado {
  const conGastos = anterior?.resultadoCentavos != null ? anterior : null;
  const resultado =
    actual.resultadoCentavos === null || !conGastos
      ? null
      : variacion(actual.resultadoCentavos, conGastos.resultadoCentavos);
  return {
    ventas: variacion(actual.ventasCentavos, anterior?.ventasCentavos ?? null),
    gastos: variacion(actual.gastosCentavos, conGastos?.gastosCentavos ?? null),
    resultado,
  };
}
