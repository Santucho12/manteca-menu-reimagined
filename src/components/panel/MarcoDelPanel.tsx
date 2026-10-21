import type { ReactNode } from 'react';
import type { EnlaceDelMarco } from '@/lib/acceso/marco';
import { BarraLateral } from './BarraLateral';
import { BarrasDelCelular } from './BarrasDelCelular';

type Props = { nombre: string; enlaces: EnlaceDelMarco[]; children: ReactNode };

/**
 * El marco de cada pantalla del panel: la sidebar flotante en la computadora, las barras fijas
 * en el celular y el contenido sobre el lienzo claro (skill estetica-panel).
 */
export function MarcoDelPanel({ nombre, enlaces, children }: Props) {
  return (
    <div className="panel-moderno bg-background text-foreground min-h-dvh">
      <BarraLateral nombre={nombre} enlaces={enlaces} />
      <BarrasDelCelular nombre={nombre} enlaces={enlaces} />
      <main className="relative min-h-dvh overflow-clip px-4 pt-20 pb-28 md:px-8 lg:ml-[276px] lg:p-10">
        <div className="absolute top-0 right-0 -z-10 h-[420px] w-[420px] translate-x-1/3 -translate-y-1/3 rounded-full bg-indigo-400/15 blur-[110px]" />
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
