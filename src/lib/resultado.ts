/** El resultado de una accion: los datos, o el mensaje para la persona si no se pudo. */
export type Resultado<T = undefined> = { ok: true; datos: T } | { ok: false; mensaje: string };

export function exito<T>(datos: T): Resultado<T> {
  return { ok: true, datos };
}

export function fallo(mensaje: string): { ok: false; mensaje: string } {
  return { ok: false, mensaje };
}
