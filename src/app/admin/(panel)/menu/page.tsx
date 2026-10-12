import type { Metadata } from 'next';
import Link from 'next/link';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { Button } from '@/components/ui/button';
import { exigirPagina } from '@/lib/acceso/servidor';
import { leerPanel } from '@/lib/menu/consultas';
import { AvisoDeFudo } from './AvisoDeFudo';
import { TarjetaDeCategoria } from './TarjetaDeCategoria';

export const metadata: Metadata = { title: 'Menú' };

export default async function PaginaDelMenu() {
  const { cliente } = await exigirPagina('admin');
  const categorias = await leerPanel(cliente);
  return (
    <div className="space-y-6">
      <TituloDePagina subtitulo="Lo que ve el cliente en la carta: categorías, productos y precios.">
        Menú
      </TituloDePagina>
      <AvisoDeFudo />
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/admin/menu/categorias/nueva">Nueva categoría</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/menu/productos/nuevo">Nuevo producto</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/menu/aumento">Aumento de precios</Link>
        </Button>
      </div>
      {categorias.map((categoria) => (
        <TarjetaDeCategoria key={categoria.id} categoria={categoria} />
      ))}
      <Link
        href="/admin/menu/desactivados"
        className="inline-block py-2 text-sm underline underline-offset-4"
      >
        Ver desactivados
      </Link>
    </div>
  );
}
