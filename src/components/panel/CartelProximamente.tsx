'use client';

import { Clock } from 'lucide-react';
import { useEffect, useRef } from 'react';

type Props = { abierto: boolean; alCerrar: () => void };

/** El cartel en el medio de la pantalla de una seccion que todavia no esta lista. */
export function CartelProximamente({ abierto, alCerrar }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;
    if (abierto && !elemento.open) elemento.showModal();
    if (!abierto && elemento.open) elemento.close();
  }, [abierto]);
  return (
    <dialog
      ref={dialogo}
      aria-labelledby="proximamente"
      onClose={alCerrar}
      onClick={(evento) => evento.target === evento.currentTarget && alCerrar()}
      className="bg-card text-card-foreground m-auto w-[min(90vw,360px)] rounded-3xl border p-8 text-center shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <span className="bg-accent/15 mx-auto grid size-14 place-items-center rounded-2xl">
        <Clock size={26} aria-hidden />
      </span>
      <h2 id="proximamente" className="font-heading mt-5 text-2xl font-bold">
        Próximamente
      </h2>
      <p className="text-muted-foreground mt-2 text-sm">Esta sección todavía no está disponible.</p>
      <form method="dialog">
        <button
          type="submit"
          className="bg-accent text-accent-foreground mt-6 min-h-11 w-full rounded-2xl px-6 text-sm font-bold"
        >
          Entendido
        </button>
      </form>
    </dialog>
  );
}
