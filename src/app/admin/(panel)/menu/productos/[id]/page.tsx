import { Package } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CargadoPor } from '@/components/panel/CargadoPor';
import { Pantalla } from '@/components/panel/Pantalla';
import { Seccion } from '@/components/panel/Seccion';
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
    <Pantalla
      titulo={`Editar ${inicial.nombre}`}
      subtitulo="Cambiá sus datos y sus precios."
      ayuda="menu"
    >
      <CargadoPor cliente={cliente} tabla="productos" id={id} />
      <Seccion icono={<Package className="text-primary" size={24} />}>
        <FormularioDeProducto inicial={inicial} opciones={opciones} />
      </Seccion>
    </Pantalla>
  );
}
