export const POR_PAGINA_DE_REPORTE = 50;

/** Una pagina de una lista ya calculada; una pagina que no existe se recorta a la ultima. */
export function paginaDe<T>(filas: T[], pagina: number) {
  const paginas = Math.max(1, Math.ceil(filas.length / POR_PAGINA_DE_REPORTE));
  const actual = Math.min(Math.max(1, pagina), paginas);
  const desde = (actual - 1) * POR_PAGINA_DE_REPORTE;
  return { filas: filas.slice(desde, desde + POR_PAGINA_DE_REPORTE), pagina: actual, paginas };
}
