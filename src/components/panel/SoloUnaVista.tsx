'use client';

import { useSyncExternalStore, type ReactNode } from 'react';

const CONSULTA = '(min-width: 1280px)';

function suscribir(avisar: () => void) {
  const lista = window.matchMedia(CONSULTA);
  lista.addEventListener('change', avisar);
  return () => lista.removeEventListener('change', avisar);
}

type Props = { tabla: ReactNode; tarjetas: ReactNode };

/**
 * La tabla desde xl y las tarjetas por debajo, como Plan Reminder Pro (alla elige con JS). El
 * servidor manda las dos, escondidas con CSS, para que no haya salto al cargar; ya hidratada la
 * pagina queda en el DOM solo la que se ve: un texto no aparece dos veces.
 */
export function SoloUnaVista({ tabla, tarjetas }: Props) {
  const ancha = useSyncExternalStore(
    suscribir,
    () => window.matchMedia(CONSULTA).matches,
    () => null,
  );
  if (ancha === null) {
    return (
      <>
        {tabla}
        {tarjetas}
      </>
    );
  }
  return ancha ? tabla : tarjetas;
}
