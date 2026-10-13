import type { ReactNode } from 'react';

type Props = { children: ReactNode; subtitulo?: string };

/**
 * El hero de cada pantalla del panel (skill estetica-panel): titulo grande y apretado y, en las
 * principales, una linea que dice para que es. En Neufile Grotesk: Manic no dibuja los acentos.
 */
export function TituloDePagina({ children, subtitulo }: Props) {
  return (
    <div className="mb-6 md:mb-10">
      <h1 className="font-heading text-2xl font-bold tracking-tight md:text-4xl">{children}</h1>
      {subtitulo ? (
        <p className="text-muted-foreground mt-1 text-sm font-medium md:mt-2 md:text-base">
          {subtitulo}
        </p>
      ) : null}
    </div>
  );
}
