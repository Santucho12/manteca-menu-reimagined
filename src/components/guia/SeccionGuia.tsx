import { useId, type ReactNode } from 'react';

type Props = { titulo: string; children: ReactNode };

/** Una seccion de la guia, nombrada por su titulo para poder ubicarla. */
export function SeccionGuia({ titulo, children }: Props) {
  const idTitulo = useId();
  return (
    <section aria-labelledby={idTitulo} className="space-y-4">
      <h2 id={idTitulo} className="font-heading text-2xl font-semibold">
        {titulo}
      </h2>
      {children}
    </section>
  );
}
