import type { ReactNode } from 'react';
import type { EnlaceDelMarco } from '@/lib/acceso/marco';
import { BarraLateral } from './BarraLateral';
import { BarrasDelCelular } from './BarrasDelCelular';

type Props = { nombre: string; enlaces: EnlaceDelMarco[]; children: ReactNode };

/**
 * El marco de cada pantalla del panel: la sidebar fija en la computadora, las barras fijas en el
 * celular y el contenido sobre el crema de Manteca (skill estetica-panel).
 */
export function MarcoDelPanel({ nombre, enlaces, children }: Props) {
  return (
    <div className="bg-background text-foreground min-h-dvh">
      <BarraLateral nombre={nombre} enlaces={enlaces} />
      <BarrasDelCelular nombre={nombre} enlaces={enlaces} />
      <main className="relative min-h-dvh overflow-clip px-4 pt-20 pb-28 md:px-8 lg:ml-[260px] lg:p-10">
        <div className="bg-accent/10 absolute top-0 right-0 -z-10 h-[500px] w-[500px] translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]" />
        <div className="bg-accent/5 absolute bottom-0 left-0 -z-10 h-[300px] w-[300px] -translate-x-1/2 translate-y-1/2 rounded-full blur-[80px]" />
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
