import type { OpcionDeVenta } from './opciones';

const sinTildes = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Las opciones que tienen todas las palabras escritas, sin importar tildes, mayúsculas ni orden. */
export function buscarOpciones(opciones: OpcionDeVenta[], escrito: string): OpcionDeVenta[] {
  const palabras = sinTildes(escrito).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return opciones;
  return opciones.filter((opcion) => {
    const texto = sinTildes(opcion.texto);
    return palabras.every((palabra) => texto.includes(palabra));
  });
}
