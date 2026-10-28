import { Tags } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Pantalla } from '@/components/panel/Pantalla';
import { Seccion } from '@/components/panel/Seccion';
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
    <Pantalla
      titulo={`Editar ${inicial.nombre}`}
      subtitulo="Cambiá sus datos y cómo se vende."
      ayuda="menu"
    >
      <Seccion icono={<Tags className="text-primary" size={24} />}>
        <FormularioDeCategoria inicial={inicial} localId={await localDeQuienPide(cliente)} />
      </Seccion>
    </Pantalla>
  );
}
