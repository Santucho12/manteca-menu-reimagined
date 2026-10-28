/** La dirección de una lista con el texto buscado: conserva los otros filtros y vuelve a la página 1. */
export function enlaceDeBusqueda(
  ruta: string,
  filtros: Record<string, string>,
  texto: string,
): string {
  const parametros = new URLSearchParams(filtros);
  parametros.delete('pagina');
  parametros.delete('q');
  const buscado = texto.trim();
  if (buscado !== '') parametros.set('q', buscado);
  const consulta = parametros.toString();
  return consulta ? `${ruta}?${consulta}` : ruta;
}
