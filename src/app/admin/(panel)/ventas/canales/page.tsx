import type { Metadata } from 'next';
import Link from 'next/link';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { Badge } from '@/components/ui/badge';
import { exigirPagina } from '@/lib/acceso/servidor';
import { canalesDeVenta } from '@/lib/ventas/consultas';
import { FormularioDeCanal } from './FormularioDeCanal';

export const metadata: Metadata = { title: 'Canales de venta' };

export default async function PaginaDeCanales() {
  const { cliente } = await exigirPagina('admin');
  const canales = await canalesDeVenta(cliente);
  return (
    <div className="space-y-6">
      <TituloDePagina>Canales de venta</TituloDePagina>
      <p className="text-muted-foreground max-w-xl text-sm">
        Por dónde entran las ventas que no pasan por Fudo.
      </p>
      <FormularioDeCanal />
      <ul aria-label="Canales" className="bg-card divide-y rounded-xl border">
        {canales.map((canal) => (
          <li key={canal.id} className="flex flex-wrap items-center gap-2 p-4">
            <Link
              href={`/admin/ventas/canales/${canal.id}`}
              className="font-medium underline-offset-4 hover:underline"
            >
              {canal.nombre}
            </Link>
            {canal.activo ? null : <Badge variant="outline">Desactivado</Badge>}
          </li>
        ))}
      </ul>
      <Link href="/admin/ventas" className="inline-block py-2 text-sm underline underline-offset-4">
        Volver a ventas
      </Link>
    </div>
  );
}
