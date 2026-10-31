import type { Metadata } from 'next';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { leerPanel } from '@/lib/menu/consultas';
import { FormularioDeAumento } from './FormularioDeAumento';

export const metadata: Metadata = { title: 'Aumentar precios' };

export default async function PaginaDeAumento() {
  const { datos: panel } = await exigirPaginaYLeer('admin', leerPanel);
  const categorias = panel.map(({ id, nombre }) => ({ id, nombre }));
  return (
    <Pantalla
      titulo="Aumentar precios"
      subtitulo="Toca todos los precios del alcance, también los de productos ocultos. Primero mirá los cambios; no hay deshacer."
      ayuda="aumento"
    >
      <FormularioDeAumento categorias={categorias} />
    </Pantalla>
  );
}
