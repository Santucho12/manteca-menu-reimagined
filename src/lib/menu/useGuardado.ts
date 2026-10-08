import { useState } from 'react';
import type { Resultado } from '../resultado';
import type { Guardado } from './escritura';

type Estado<T> = { mensaje: string | null; pendiente: { datos: T; productos: string[] } | null };

// Lo que muestra la pantalla despues de guardar: el error, la pregunta o nada.
function estadoDespuesDe<T>(resultado: Resultado<Guardado>, datos: T): Estado<T> {
  if (!resultado.ok) return { mensaje: resultado.mensaje, pendiente: null };
  if (resultado.datos.estado === 'confirmar') {
    return { mensaje: null, pendiente: { datos, productos: resultado.datos.productos } };
  }
  return { mensaje: null, pendiente: null };
}

/**
 * Guarda y, si la base avisa que el cambio oculta productos, guarda la lista para preguntar.
 * Confirmar repite el mismo guardado con la confirmacion.
 */
export function useGuardado<T>(
  accion: (datos: T & { confirmar: boolean }) => Promise<Resultado<Guardado>>,
  alGuardar: () => void,
) {
  const [estado, setEstado] = useState<Estado<T>>({ mensaje: null, pendiente: null });
  async function guardar(datos: T, confirmar: boolean) {
    const resultado = await accion({ ...datos, confirmar });
    setEstado(estadoDespuesDe(resultado, datos));
    if (resultado.ok && resultado.datos.estado === 'guardado') alGuardar();
  }
  const { pendiente } = estado;
  return {
    mensaje: estado.mensaje,
    pendiente: pendiente?.productos ?? null,
    enviar: (datos: T) => guardar(datos, false),
    confirmar: async () => (pendiente ? guardar(pendiente.datos, true) : undefined),
    cancelar: () => setEstado({ mensaje: null, pendiente: null }),
  };
}
