import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CargadoPor } from '@/components/panel/CargadoPor';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { Badge } from '@/components/ui/badge';
import { exigirPagina } from '@/lib/acceso/servidor';
import { nombreDeMedio } from '@/lib/caja/pantalla';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { formatearPesos } from '@/lib/plata';
import { ventaPorId, type Venta } from '@/lib/ventas/consultas';
import { estadoDeVenta, nombreDeOrigen } from '@/lib/ventas/pantalla';
import { cantidadParaMostrar } from '@/lib/ventas/renglones';
import { BotonDeAnularVenta } from './BotonDeAnularVenta';

export const metadata: Metadata = { title: 'Venta' };

function Renglones({ venta }: { venta: Venta }) {
  return (
    <ul aria-label="Productos" className="bg-card divide-y rounded-xl border">
      {venta.renglones.map((renglon) => (
        <li key={renglon.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
          <div className="min-w-0 space-y-1">
            <p className="font-medium">{renglon.descripcion}</p>
            <p className="text-muted-foreground text-sm">
              {cantidadParaMostrar(renglon.cantidad)} ×{' '}
              {formatearPesos(renglon.precio_unitario_centavos)}
            </p>
          </div>
          <span>{formatearPesos(renglon.subtotal_centavos)}</span>
        </li>
      ))}
    </ul>
  );
}

// Lo que se puede hacer con la venta: anular la de a mano; la de Fudo se corrige alla.
function Acciones({ venta }: { venta: Venta }) {
  if (venta.anulado) return <p className="font-medium">Anulada: {venta.motivo_anulacion}</p>;
  if (venta.origen === 'fudo') {
    return <p className="text-muted-foreground text-sm">Las ventas de Fudo se corrigen en Fudo.</p>;
  }
  return <BotonDeAnularVenta id={venta.id} />;
}

export default async function FichaDeVenta({ params }: { params: Promise<{ id: string }> }) {
  const { cliente } = await exigirPagina('admin');
  const venta = await ventaPorId(cliente, (await params).id);
  if (!venta) notFound();
  const pagos = venta.pagos.map(
    (p) => `${nombreDeMedio(p.medio)} ${formatearPesos(p.monto_centavos)}`,
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <TituloDePagina>Venta del {fechaParaMostrar(venta.fecha)}</TituloDePagina>
        <Badge variant="outline">{estadoDeVenta(venta)}</Badge>
      </div>
      <p className="text-muted-foreground">
        {[nombreDeOrigen(venta.origen), venta.canal].filter(Boolean).join(' · ')}
      </p>
      <CargadoPor cliente={cliente} tabla="ventas" id={venta.id} />
      <Renglones venta={venta} />
      <p className="text-lg font-semibold">Total: {formatearPesos(venta.total_centavos)}</p>
      {pagos.length > 0 ? <p>Cobrado con: {pagos.join(' · ')}</p> : null}
      {venta.comentario ? <p className="whitespace-pre-line">{venta.comentario}</p> : null}
      <Acciones venta={venta} />
      <Link href="/admin/ventas" className="inline-block py-2 text-sm underline underline-offset-4">
        Volver a ventas
      </Link>
    </div>
  );
}
