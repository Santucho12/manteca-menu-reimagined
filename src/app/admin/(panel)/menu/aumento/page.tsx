import type { Metadata } from 'next';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPagina } from '@/lib/acceso/servidor';
import { leerPanel } from '@/lib/menu/consultas';
import { FormularioDeAumento } from './FormularioDeAumento';

export const metadata: Metadata = { title: 'Aumento de precios' };

export default async function PaginaDeAumento() {
  const { cliente } = await exigirPagina('admin');
  const categorias = (await leerPanel(cliente)).map(({ id, nombre }) => ({ id, nombre }));
  return (
    <Pantalla
      titulo="Aumento de precios"
      subtitulo="Toca todos los precios del alcance, también los de productos ocultos. Primero mirá los cambios; no hay deshacer."
      ayuda="aumento"
    >
      <FormularioDeAumento categorias={categorias} />
    </Pantalla>
  );
}
