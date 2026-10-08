import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Nada del panel se indexa: ni el ingreso ni el registro.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function LayoutDelAdmin({ children }: { children: ReactNode }) {
  return children;
}
