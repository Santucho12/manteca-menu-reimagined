import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { exigirPagina } from '@/lib/acceso/servidor';
import { proveedorPorId, type Proveedor } from '@/lib/proveedores/consultas';
import { telefonoParaMostrar, urlDeWhatsApp } from '@/lib/proveedores/telefono';
import { BotonDeEstado } from '../BotonDeEstado';

export const metadata: Metadata = { title: 'Proveedor' };

function Dato({ titulo, valor }: { titulo: string; valor: string | null }) {
  return (
    <div>
      <dt className="text-muted-foreground text-sm">{titulo}</dt>
      <dd className="whitespace-pre-line">{valor ?? '—'}</dd>
    </div>
  );
}

function Datos({ proveedor }: { proveedor: Proveedor }) {
  const telefono = proveedor.telefono ? telefonoParaMostrar(proveedor.telefono) : null;
  return (
    <dl className="bg-card grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
      <Dato titulo="Teléfono" valor={telefono} />
      <Dato titulo="Ubicación" valor={proveedor.ubicacion} />
      <Dato titulo="Qué le comprás" valor={proveedor.que_compra} />
      <Dato titulo="Observaciones" valor={proveedor.observaciones} />
    </dl>
  );
}

export default async function FichaDeProveedor({ params }: { params: Promise<{ id: string }> }) {
  const { cliente } = await exigirPagina('admin');
  const proveedor = await proveedorPorId(cliente, (await params).id);
  if (!proveedor) notFound();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <TituloDePagina>{proveedor.nombre}</TituloDePagina>
        {proveedor.activo ? null : <Badge variant="outline">Desactivado</Badge>}
      </div>
      <Datos proveedor={proveedor} />
      <div className="flex flex-wrap items-start gap-2">
        {proveedor.telefono ? (
          <Button asChild>
            <a href={urlDeWhatsApp(proveedor.telefono)} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <Link href={`/admin/proveedores/${proveedor.id}/editar`}>Editar</Link>
        </Button>
        <BotonDeEstado id={proveedor.id} activo={proveedor.activo} />
      </div>
      <p className="text-muted-foreground text-sm">
        Los gastos pagados a este proveedor se van a ver acá cuando esté el módulo de Gastos.
      </p>
      <Link
        href="/admin/proveedores"
        className="inline-block py-2 text-sm underline underline-offset-4"
      >
        Volver a proveedores
      </Link>
    </div>
  );
}
