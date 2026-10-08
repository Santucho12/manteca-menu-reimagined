import { useState } from 'react';
import { useUnaVez } from '../formularios/useUnaVez';
import type { Resultado } from '../resultado';
import type { Guardado } from './escritura';

type Estado<T> = { mensaje: string | null; pendiente: { datos: T; productos: string[] } | null };
type Accion<T> = (datos: T & { confirmar: boolean }) => Promise<Resultado<Guardado>>;

const SIN_NADA = { mensaje: null, pendiente: null };

// Lo que muestra la pantalla despues de guardar: el error, la pregunta o nada.
function estadoDespuesDe<T>(resultado: Resultado<Guardado>, datos: T): Estado<T> {
  if (!resultado.ok) return { mensaje: resultado.mensaje, pendiente: null };
  if (resultado.datos.estado === 'confirmar') {
    return { mensaje: null, pendiente: { datos, productos: resultado.datos.productos } };
  }
  return SIN_NADA;
}

const seGuardo = (resultado: Resultado<Guardado>) =>
  resultado.ok && resultado.datos.estado === 'guardado';

/**
 * Guarda y, si la base avisa que el cambio oculta productos, guarda la lista para preguntar.
 * Confirmar repite el mismo guardado con la confirmacion. Un doble clic no guarda dos veces.
 */
export function useGuardado<T>(accion: Accion<T>, alGuardar: () => void) {
  const [estado, setEstado] = useState<Estado<T>>(SIN_NADA);
  const { enviando, unaVez } = useUnaVez();
  const guardar = (datos: T, confirmar: boolean) =>
    unaVez(async () => {
      const resultado = await accion({ ...datos, confirmar });
      setEstado(estadoDespuesDe(resultado, datos));
      if (seGuardo(resultado)) alGuardar();
    });
  const { pendiente } = estado;
  return {
    mensaje: estado.mensaje,
    enviando,
    pendiente: pendiente?.productos ?? null,
    enviar: (datos: T) => guardar(datos, false),
    confirmar: async () => (pendiente ? guardar(pendiente.datos, true) : undefined),
    cancelar: () => setEstado(SIN_NADA),
  };
}
