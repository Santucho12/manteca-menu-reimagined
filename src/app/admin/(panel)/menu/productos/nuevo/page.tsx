import type { Metadata } from 'next';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
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
    <div className="space-y-6">
      <TituloDePagina>Nuevo producto</TituloDePagina>
      <FormularioDeProducto inicial={VACIO} opciones={opciones} />
    </div>
  );
}
