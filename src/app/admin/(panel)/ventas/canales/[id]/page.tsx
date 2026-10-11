import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { Badge } from '@/components/ui/badge';
import { exigirPagina } from '@/lib/acceso/servidor';
import { canalesDeVenta } from '@/lib/ventas/consultas';
import { BotonDeEstado } from '../../../gastos/BotonDeEstado';
import { cambiarEstadoDeCanalDesdeElPanel } from '../../acciones';
import { FormularioDeCanal } from '../FormularioDeCanal';

export const metadata: Metadata = { title: 'Canal de venta' };

export default async function FichaDeCanal({ params }: { params: Promise<{ id: string }> }) {
  const { cliente } = await exigirPagina('admin');
  const { id } = await params;
  // Son pocos: se buscan en la lista.
  const canal = (await canalesDeVenta(cliente)).find((c) => c.id === id);
  if (!canal) notFound();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <TituloDePagina>{canal.nombre}</TituloDePagina>
        {canal.activo ? null : <Badge variant="outline">Desactivado</Badge>}
      </div>
      <FormularioDeCanal id={canal.id} inicial={canal.nombre} />
      <p className="text-muted-foreground max-w-xl text-sm">
        Desactivarlo no cambia las ventas que ya lo usan: solo deja de ofrecerse al cargar.
      </p>
      <BotonDeEstado
        id={canal.id}
        activo={canal.activo}
        cambiar={cambiarEstadoDeCanalDesdeElPanel}
      />
      <Link
        href="/admin/ventas/canales"
        className="inline-block py-2 text-sm underline underline-offset-4"
      >
        Volver a canales
      </Link>
    </div>
  );
}
