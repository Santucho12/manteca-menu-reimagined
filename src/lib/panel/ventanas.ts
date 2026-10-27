import { useEffect, useSyncExternalStore } from 'react';
import { bloquearScrollDeLaPagina } from './scrollSuave';

/** Mientras la ventana está abierta, el scroll de la página queda quieto. */
export function useBloquearElFondo(abierta: boolean): void {
  useEffect(() => {
    if (!abierta) return;
    bloquearScrollDeLaPagina(true);
    return () => bloquearScrollDeLaPagina(false);
  }, [abierta]);
}

/** Escape cierra la ventana abierta, como en Plan Reminder Pro. */
export function useCerrarConEscape(abierta: boolean, cerrar: () => void): void {
  useEffect(() => {
    if (!abierta) return;
    const alApretar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') cerrar();
    };
    document.addEventListener('keydown', alApretar);
    return () => document.removeEventListener('keydown', alApretar);
  }, [abierta, cerrar]);
}

const sinCambios = () => () => {};

/**
 * El main del panel, donde van las ventanas: fuera de lo animado o con backdrop-blur (que ataria
 * el fixed) y con su alert donde lo buscan las pruebas.
 */
export function useDestinoEnMain(): HTMLElement | null {
  return useSyncExternalStore(
    sinCambios,
    () => document.querySelector('main'),
    () => null,
  );
}
