import type { Metadata } from 'next';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { exigirPagina } from '@/lib/acceso/servidor';
import { leerPanel } from '@/lib/menu/consultas';
import { FormularioDeAumento } from './FormularioDeAumento';

export const metadata: Metadata = { title: 'Aumento de precios' };

export default async function PaginaDeAumento() {
  const { cliente } = await exigirPagina('admin');
  const categorias = (await leerPanel(cliente)).map(({ id, nombre }) => ({ id, nombre }));
  return (
    <div className="space-y-6">
      <TituloDePagina>Aumento de precios</TituloDePagina>
      <p className="text-muted-foreground text-sm">
        Toca todos los precios del alcance, también los de productos ocultos. Primero mirá los
        cambios; no hay deshacer: un error se corrige con otro aumento o editando el precio.
      </p>
      <FormularioDeAumento categorias={categorias} />
    </div>
  );
}
