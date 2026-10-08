import type { ReactNode } from 'react';

/** El titulo de cada pantalla del panel, en Neufile Grotesk: Manic no dibuja los acentos. */
export function TituloDePagina({ children }: { children: ReactNode }) {
  return <h1 className="font-heading text-3xl font-semibold">{children}</h1>;
}
