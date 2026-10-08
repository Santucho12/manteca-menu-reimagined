import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
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
  const inicial = productoParaEditar(panel, (await params).id);
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
      <FormularioDeProducto inicial={inicial} opciones={opciones} />
    </div>
  );
}
