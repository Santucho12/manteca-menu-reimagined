import type { ReactNode } from 'react';
import { TrabaDelCierre } from '@/components/caja/TrabaDelCierre';
import { MarcoDelPanel } from '@/components/panel/MarcoDelPanel';
import { datosDelMarco, exigirPagina, type Acceso } from '@/lib/acceso/servidor';
import { estadoDelMostrador } from '@/lib/vender/consultas';

// Solo quien vende lee el estado del mostrador: la ventana del cierre es para Caja y el admin.
async function estadoParaLaTraba({ cliente, estado }: Acceso) {
  if (estado !== 'caja' && estado !== 'admin') return null;
  return estadoDelMostrador(cliente).catch(() => null);
}

export default async function LayoutDelMarco({ children }: { children: ReactNode }) {
  const acceso = await exigirPagina('panel');
  const [marco, traba] = await Promise.all([datosDelMarco(acceso), estadoParaLaTraba(acceso)]);
  return (
    <MarcoDelPanel {...marco}>
      {traba ? <TrabaDelCierre inicial={traba} acceso={acceso.estado} /> : null}
      {children}
    </MarcoDelPanel>
  );
}
