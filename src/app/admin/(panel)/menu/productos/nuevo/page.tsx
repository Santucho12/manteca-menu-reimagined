import { Package } from 'lucide-react';
import type { Metadata } from 'next';
import { Pantalla } from '@/components/panel/Pantalla';
import { Seccion } from '@/components/panel/Seccion';
import { exigirPagina } from '@/lib/acceso/servidor';
import { leerPanel } from '@/lib/menu/consultas';
import { FormularioDeProducto } from '../FormularioDeProducto';

export const metadata: Metadata = { title: 'Nuevo producto' };

const VACIO = {
  id: '',
  categoriaId: '',
  nombre: '',
  descripcion: '',
  etiqueta: '' as const,
  visible: false,
  precios: [],
};

export default async function PaginaNuevoProducto() {
  const { cliente } = await exigirPagina('admin');
  const opciones = (await leerPanel(cliente)).map(
    ({ id, nombre, presentaciones, compartidos }) => ({ id, nombre, presentaciones, compartidos }),
  );
  return (
    <Pantalla
      titulo="Nuevo producto"
      subtitulo="Elegí su categoría y cargale los precios."
      ayuda="menu"
    >
      <Seccion icono={<Package className="text-primary" size={24} />}>
        <FormularioDeProducto inicial={VACIO} opciones={opciones} />
      </Seccion>
    </Pantalla>
  );
}
