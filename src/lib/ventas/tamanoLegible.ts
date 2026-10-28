const KB = 1024;
const MB = KB * 1024;

const conComa = (valor: number) => String(Math.round(valor * 10) / 10).replace('.', ',');

/** El tamaño de un archivo como se lee en un explorador: "512 B", "1,5 KB", "5 MB". */
export function tamanoLegible(bytes: number): string {
  if (bytes < KB) return `${bytes} B`;
  if (bytes < MB) return `${conComa(bytes / KB)} KB`;
  return `${conComa(bytes / MB)} MB`;
}
