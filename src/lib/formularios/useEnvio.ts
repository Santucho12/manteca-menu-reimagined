import { useState } from 'react';
import type { Resultado } from '../resultado';

type Estado = { mensaje: string | null; listo: boolean };

/** Manda los datos a una accion de servidor y guarda si salio bien o el mensaje de por que no. */
export function useEnvio<T, R>(
  accion: (datos: T) => Promise<Resultado<R>>,
  alTerminar?: (datos: R) => void,
) {
  const [estado, setEstado] = useState<Estado>({ mensaje: null, listo: false });
  async function enviar(datos: T): Promise<void> {
    setEstado({ mensaje: null, listo: false });
    const resultado = await accion(datos);
    if (!resultado.ok) {
      setEstado({ mensaje: resultado.mensaje, listo: false });
      return;
    }
    setEstado({ mensaje: null, listo: true });
    alTerminar?.(resultado.datos);
  }
  return { ...estado, enviar };
}
