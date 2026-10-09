import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { Badge } from '@/components/ui/badge';
import { exigirPagina } from '@/lib/acceso/servidor';
import { cierrePorId, type Cierre } from '@/lib/caja/consultas';
import { nombreDeEstado } from '@/lib/caja/pantalla';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { AccionesDelCierre } from './AccionesDelCierre';
import { DetalleDelCierre } from './DetalleDelCierre';

export const metadata: Metadata = { title: 'Cierre de caja' };

function Marcas({ cierre }: { cierre: Cierre }) {
  return (
    <div className="space-y-1">
      {cierre.estado === 'anulado' ? (
        <p className="font-medium">Anulado: {cierre.motivo_anulacion}</p>
      ) : null}
      {cierre.comentario_revision ? (
        <p>Comentario de la revisión: {cierre.comentario_revision}</p>
      ) : null}
    </div>
  );
}

export default async function FichaDeCierre({ params }: { params: Promise<{ id: string }> }) {
  const { cliente, estado } = await exigirPagina('caja');
  // RLS decide: Caja lee solo los suyos; uno ajeno no existe para ella.
  const cierre = await cierrePorId(cliente, (await params).id);
  if (!cierre) notFound();
  const esAdmin = estado === 'admin';
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <TituloDePagina>Cierre del {fechaParaMostrar(cierre.fecha)}</TituloDePagina>
        <Badge variant="outline">{nombreDeEstado(cierre.estado)}</Badge>
      </div>
      <p className="text-muted-foreground">Cargado por {cierre.persona}</p>
      <Marcas cierre={cierre} />
      <DetalleDelCierre cierre={cierre} />
      {esAdmin && cierre.estado !== 'anulado' ? (
        <AccionesDelCierre id={cierre.id} revisado={cierre.estado === 'revisado'} />
      ) : null}
      <Link
        href={esAdmin ? '/admin/caja/control' : '/admin/caja/mis-cierres'}
        className="inline-block py-2 text-sm underline underline-offset-4"
      >
        {esAdmin ? 'Volver al control' : 'Volver a mis cierres'}
      </Link>
    </div>
  );
}
