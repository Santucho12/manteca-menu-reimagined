import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useUnaVez } from '../formularios/useUnaVez';
import type { Resultado } from '../resultado';

type Estado = { listo: string | null; error: string | null };

/** Guarda una vez, deja escrito si salio bien o por que no, y recarga los numeros. */
export function useGuardarConAviso<T>(
  guardar: (datos: T) => Promise<Resultado<unknown>>,
  listo: string,
) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>({ listo: null, error: null });
  const { enviando, unaVez } = useUnaVez();
  const enviar = (datos: T) =>
    unaVez(async () => {
      const resultado = await guardar(datos);
      setEstado(resultado.ok ? { listo, error: null } : { listo: null, error: resultado.mensaje });
      if (resultado.ok) router.refresh();
    });
  return { ...estado, enviando, enviar };
}
