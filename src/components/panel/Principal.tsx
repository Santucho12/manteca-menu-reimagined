'use client';

import type { ReactNode } from 'react';
import { useHidratado } from '@/lib/panel/useHidratado';

/**
 * El <main> de cada pantalla del panel. Hasta que React termina de cargarla, todo lo que tiene
 * adentro figura como no disponible (aria-disabled): un toque o un texto escrito antes de eso se
 * pierde, y asi quien automatiza el navegador (o un lector de pantalla) espera a que responda.
 */
export function Principal({ className, children }: { className: string; children: ReactNode }) {
  const noDisponible = !useHidratado();
  return (
    <main aria-disabled={noDisponible || undefined} className={className}>
      {children}
    </main>
  );
}
