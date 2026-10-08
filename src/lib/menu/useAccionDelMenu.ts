import { useState } from 'react';
import type { Resultado } from '../resultado';

/** Corre una accion del menu y guarda el mensaje si no se pudo. */
export function useAccionDelMenu() {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  async function hacer(accion: () => Promise<Resultado<unknown>>): Promise<boolean> {
    setEnviando(true);
    setMensaje(null);
    const resultado = await accion();
    setEnviando(false);
    if (!resultado.ok) setMensaje(resultado.mensaje);
    return resultado.ok;
  }
  return { mensaje, enviando, hacer };
}
