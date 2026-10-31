import { Truck } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Pantalla } from '@/components/panel/Pantalla';
import { Seccion } from '@/components/panel/Seccion';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { proveedorPorId } from '@/lib/proveedores/consultas';
import { datosParaEditar } from '@/lib/proveedores/esquemas';
import { FormularioDeProveedor } from '../../FormularioDeProveedor';

export const metadata: Metadata = { title: 'Editar proveedor' };

export default async function EditarProveedor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { datos: proveedor } = await exigirPaginaYLeer('admin', (cliente) =>
    proveedorPorId(cliente, id),
  );
  if (!proveedor) notFound();
  return (
    <Pantalla
      titulo={`Editar ${proveedor.nombre}`}
      subtitulo="Corregí los datos del proveedor."
      ayuda="proveedores"
    >
      <Seccion icono={<Truck className="text-primary" size={24} />}>
        <FormularioDeProveedor inicial={datosParaEditar(proveedor)} id={proveedor.id} />
      </Seccion>
    </Pantalla>
  );
}
