const MARCA = 987654321;

/** La dirección de cada página a partir de una sola con la marca, para armarla en el navegador. */
export const plantillaDePagina = (enlaceA: (pagina: number) => string) => enlaceA(MARCA);

/** Lo escrito, llevado a una página que exista; vacío o con letras, ninguna. */
export function paginaElegida(texto: string, ultima: number): number | null {
  const numero = Number.parseInt(texto, 10);
  if (Number.isNaN(numero)) return null;
  return Math.min(Math.max(numero, 1), ultima);
}

export const direccionDePagina = (plantilla: string, primera: string, pagina: number) =>
  pagina === 1 ? primera : plantilla.replace(String(MARCA), String(pagina));
