import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import type { EnlaceDelMarco } from '@/lib/acceso/marco';
import { AvisoDeProximamente } from './AvisoDeProximamente';
import { BarraLateral } from './BarraLateral';
import { BarrasDelCelular } from './BarrasDelCelular';
import { Principal } from './Principal';

type Props = { nombre: string; enlaces: EnlaceDelMarco[]; children: ReactNode };

/**
 * La raiz de Plan Reminder Pro. Sin sus manchas de color: alla quedan detras del fondo y no se
 * ven. La barra lateral y las del celular se dibujan siempre y las alterna el CSS.
 */
export function MarcoDelPanel({ nombre, enlaces, children }: Props) {
  return (
    <div className="min-h-screen bg-background">
      <BarraLateral nombre={nombre} enlaces={enlaces} />
      <BarrasDelCelular nombre={nombre} enlaces={enlaces} />
      <Principal className="lg:ml-[234px] px-4 md:px-8 pt-20 pb-28 lg:px-10 lg:pt-8 lg:pb-10 min-h-screen relative overflow-clip">
        <Toaster />
        <AvisoDeProximamente />
        <div className="max-w-7xl mx-auto">{children}</div>
      </Principal>
    </div>
  );
}
