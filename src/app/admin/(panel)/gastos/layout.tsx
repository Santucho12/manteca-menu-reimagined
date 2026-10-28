import type { ReactNode } from 'react';

/** Gastos no usa el dorado de la marca: sus botones van en blanco con sombra (panel.css). */
export default function LayoutDeGastos({ children }: { children: ReactNode }) {
  return <div className="modulo-sin-dorado">{children}</div>;
}
