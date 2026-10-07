import type { ReactNode } from 'react';
import { MarcoDelPanel } from '@/components/panel/MarcoDelPanel';
import { datosDelMarco, exigirPagina } from '@/lib/acceso/servidor';

export default async function LayoutDelPanel({ children }: { children: ReactNode }) {
  const marco = await datosDelMarco(await exigirPagina('panel'));
  return <MarcoDelPanel {...marco}>{children}</MarcoDelPanel>;
}
