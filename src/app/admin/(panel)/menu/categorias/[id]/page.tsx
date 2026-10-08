import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { exigirPagina } from '@/lib/acceso/servidor';
import { leerPanel, localDeQuienPide } from '@/lib/menu/consultas';
import { categoriaParaEditar } from '@/lib/menu/panel';
import { FormularioDeCategoria } from '../FormularioDeCategoria';

export const metadata: Metadata = { title: 'Editar categoría' };

export default async function PaginaEditarCategoria({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { cliente } = await exigirPagina('admin');
  const inicial = categoriaParaEditar(await leerPanel(cliente), (await params).id);
  if (!inicial) notFound();
  return (
    <div className="space-y-6">
      <TituloDePagina>Editar {inicial.nombre}</TituloDePagina>
      <FormularioDeCategoria inicial={inicial} localId={await localDeQuienPide(cliente)} />
    </div>
  );
}
