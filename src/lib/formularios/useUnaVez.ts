import { useRef, useState } from 'react';

/**
 * Corre una accion por vez: un doble clic no la manda dos veces. La marca va en un ref porque
 * el segundo clic llega antes de que React vuelva a dibujar el boton desactivado.
 */
export function useUnaVez() {
  const enCurso = useRef(false);
  const [enviando, setEnviando] = useState(false);
  async function unaVez(accion: () => Promise<void>): Promise<void> {
    if (enCurso.current) return;
    enCurso.current = true;
    setEnviando(true);
    try {
      await accion();
    } finally {
      enCurso.current = false;
      setEnviando(false);
    }
  }
  return { enviando, unaVez };
}
