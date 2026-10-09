import { useState } from 'react';
import { useUnaVez } from '../formularios/useUnaVez';
import type { Resultado } from '../resultado';

/** Guarda una vez por clic; si no se pudo, deja el mensaje para la persona. */
export function useGuardar<T, R>(
  guardar: (datos: T) => Promise<Resultado<R>>,
  alGuardar: (respuesta: R) => void,
) {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const { enviando, unaVez } = useUnaVez();
  const enviar = (datos: T) =>
    unaVez(async () => {
      const resultado = await guardar(datos);
      setMensaje(resultado.ok ? null : resultado.mensaje);
      if (resultado.ok) alGuardar(resultado.datos);
    });
  return { mensaje, enviando, enviar };
}
