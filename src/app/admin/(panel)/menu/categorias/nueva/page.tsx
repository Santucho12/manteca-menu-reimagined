import type { Metadata } from 'next';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { exigirPagina } from '@/lib/acceso/servidor';
import { localDeQuienPide } from '@/lib/menu/consultas';
import { FormularioDeCategoria } from '../FormularioDeCategoria';

export const metadata: Metadata = { title: 'Nueva categoría' };

const VACIA = {
  id: '',
  nombre: '',
  subtitulo: '',
  icono: '🥐' as const,
  foto: '',
  precioCompartido: false,
  presentaciones: [{ id: '', nombre: 'Unidad', compartido: '', compartidoOriginal: '' }],
};

export default async function PaginaNuevaCategoria() {
  const { cliente } = await exigirPagina('admin');
  return (
    <div className="space-y-6">
      <TituloDePagina>Nueva categoría</TituloDePagina>
      <p className="text-muted-foreground text-sm">
        Se crea oculta: mostrala desde el menú cuando tenga productos.
      </p>
      <FormularioDeCategoria inicial={VACIA} localId={await localDeQuienPide(cliente)} />
    </div>
  );
}
