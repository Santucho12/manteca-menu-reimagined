import type { ReactNode } from 'react';

/** Lo que se muestra en vez de una tabla vacia. */
export function SinDatos({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground bg-card rounded-xl border p-4">{children}</p>;
}
