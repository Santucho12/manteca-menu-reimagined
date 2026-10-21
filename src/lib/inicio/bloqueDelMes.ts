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

/** Sin avisos no hay panel "Para atender": el bloque de ventas ocupa toda la fila. */
export function anchoDelBloque(hayAvisos: boolean): string {
  return hayAvisos ? 'lg:col-span-8' : 'lg:col-span-12';
}
