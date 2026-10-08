import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { exigirPagina } from '@/lib/acceso/servidor';
import { proveedorPorId } from '@/lib/proveedores/consultas';
import { datosParaEditar } from '@/lib/proveedores/esquemas';
import { FormularioDeProveedor } from '../../FormularioDeProveedor';

export const metadata: Metadata = { title: 'Editar proveedor' };

export default async function EditarProveedor({ params }: { params: Promise<{ id: string }> }) {
  const { cliente } = await exigirPagina('admin');
  const proveedor = await proveedorPorId(cliente, (await params).id);
  if (!proveedor) notFound();
  return (
    <div className="space-y-6">
      <TituloDePagina>Editar {proveedor.nombre}</TituloDePagina>
      <FormularioDeProveedor inicial={datosParaEditar(proveedor)} id={proveedor.id} />
    </div>
  );
}
