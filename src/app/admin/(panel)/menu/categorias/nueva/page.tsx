import { Tags } from 'lucide-react';
import type { Metadata } from 'next';
import { Pantalla } from '@/components/panel/Pantalla';
import { Seccion } from '@/components/panel/Seccion';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
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
  const { datos: localId } = await exigirPaginaYLeer('admin', localDeQuienPide);
  return (
    <Pantalla
      titulo="Nueva categoría"
      subtitulo="Se crea oculta: mostrala desde el menú cuando tenga productos."
      ayuda="menu"
    >
      <Seccion icono={<Tags className="text-primary" size={24} />}>
        <FormularioDeCategoria inicial={VACIA} localId={localId} />
      </Seccion>
    </Pantalla>
  );
}
