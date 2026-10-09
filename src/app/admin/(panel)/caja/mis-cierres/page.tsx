import type { Metadata } from 'next';
import Link from 'next/link';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { Button } from '@/components/ui/button';
import { exigirPagina } from '@/lib/acceso/servidor';
import { misCierres } from '@/lib/caja/consultas';
import { ListaDeCierres } from '../ListaDeCierres';

export const metadata: Metadata = { title: 'Mis cierres' };

export default async function MisCierres() {
  const { cliente, perfil } = await exigirPagina('caja');
  const filas = await misCierres(cliente, perfil.id);
  return (
    <div className="space-y-6">
      <TituloDePagina>Mis cierres</TituloDePagina>
      <Button asChild>
        <Link href="/admin/caja">Cargar cierre</Link>
      </Button>
      <ListaDeCierres filas={filas} />
    </div>
  );
}
