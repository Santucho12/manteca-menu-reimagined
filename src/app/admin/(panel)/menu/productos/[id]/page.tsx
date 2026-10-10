import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CargadoPor } from '@/components/panel/CargadoPor';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { exigirPagina } from '@/lib/acceso/servidor';
import { leerPanel } from '@/lib/menu/consultas';
import { productoParaEditar } from '@/lib/menu/panel';
import { FormularioDeProducto } from '../FormularioDeProducto';

export const metadata: Metadata = { title: 'Editar producto' };

export default async function PaginaEditarProducto({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { cliente } = await exigirPagina('admin');
  const panel = await leerPanel(cliente);
  const { id } = await params;
  const inicial = productoParaEditar(panel, id);
  if (!inicial) notFound();
  const opciones = panel.map(({ id, nombre, presentaciones, compartidos }) => ({
    id,
    nombre,
    presentaciones,
    compartidos,
  }));
  return (
    <div className="space-y-6">
      <TituloDePagina>Editar {inicial.nombre}</TituloDePagina>
      <CargadoPor cliente={cliente} tabla="productos" id={id} />
      <FormularioDeProducto inicial={inicial} opciones={opciones} />
    </div>
  );
}
