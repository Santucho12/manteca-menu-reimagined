import { useSyncExternalStore } from 'react';

const sinSuscripcion = () => () => {};

/**
 * Falso en el servidor y mientras React carga la pantalla; verdadero despues. Un boton que se toca
 * antes de eso no hace nada: se lo marca como no disponible (aria-disabled) hasta que responde.
 */
export function useHidratado(): boolean {
  return useSyncExternalStore(
    sinSuscripcion,
    () => true,
    () => false,
  );
}
