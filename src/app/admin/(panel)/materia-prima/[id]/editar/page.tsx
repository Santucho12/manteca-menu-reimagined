import { Wheat } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Pantalla } from '@/components/panel/Pantalla';
import { Seccion } from '@/components/panel/Seccion';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { insumoPorId } from '@/lib/materia-prima/consultas';
import { FormularioDeInsumo } from '../../FormularioDeInsumo';

export const metadata: Metadata = { title: 'Editar insumo' };

export default async function EditarInsumo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { datos: insumo } = await exigirPaginaYLeer('admin', (cliente) => insumoPorId(cliente, id));
  if (!insumo) notFound();
  const inicial = {
    nombre: insumo.nombre,
    unidad: insumo.unidad_de_uso,
    observaciones: insumo.observaciones ?? '',
  };
  return (
    <Pantalla
      titulo={`Editar ${insumo.nombre}`}
      subtitulo="Corregí los datos del insumo."
      ayuda="materia-prima"
    >
      <Seccion icono={<Wheat className="text-primary" size={24} />}>
        <FormularioDeInsumo inicial={inicial} id={insumo.id} />
      </Seccion>
    </Pantalla>
  );
}
