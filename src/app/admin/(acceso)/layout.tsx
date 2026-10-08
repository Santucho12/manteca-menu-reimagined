import type { ReactNode } from 'react';

/** Ingreso, registro y cambio obligado: una columna centrada, comoda tambien en el celular. */
export default function LayoutDeAcceso({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4 py-8">
      {children}
    </main>
  );
}
