import type { ResultadoDelPeriodo } from '../reportes/resultado';

/** Que parte de lo vendido queda como resultado, en porcentaje entero de 0 a 100. */
export function porcionDelResultado(resultado: ResultadoDelPeriodo): number | null {
  const { ventasCentavos, resultadoCentavos } = resultado;
  if (resultadoCentavos === null || ventasCentavos === 0) return null;
  // Con perdida la barra queda vacia: no hay "menos que nada" que dibujar.
  return Math.max(0, Math.min(100, Math.round((resultadoCentavos * 100) / ventasCentavos)));
}

export function textoDeLaPorcion(porcion: number | null): string {
  return porcion === null ? 'Sin calcular' : `Lo que queda de cada peso vendido: ${porcion}%`;
}

export function textoDeVentasDelMes(cantidad: number): string {
  return `Del 1 a hoy · ${cantidad} ${cantidad === 1 ? 'venta' : 'ventas'}`;
}
