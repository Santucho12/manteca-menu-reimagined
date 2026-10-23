import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BOTON_DE_ENCABEZADO, BOTON_DE_ENCABEZADO_NEUTRO } from '@/components/panel/estilos';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPagina } from '@/lib/acceso/servidor';
import { leerPanel } from '@/lib/menu/consultas';
import { AvisoDeFudo } from './AvisoDeFudo';
import { TarjetaDeCategoria } from './TarjetaDeCategoria';

export const metadata: Metadata = { title: 'Menú' };

function Accesos() {
  return (
    <>
      <Link href="/admin/menu/categorias/nueva" className={BOTON_DE_ENCABEZADO}>
        <Plus size={18} aria-hidden="true" /> Nueva categoría
      </Link>
      <Link href="/admin/menu/productos/nuevo" className={BOTON_DE_ENCABEZADO_NEUTRO}>
        Nuevo producto
      </Link>
      <Link href="/admin/menu/aumento" className={BOTON_DE_ENCABEZADO_NEUTRO}>
        Aumento de precios
      </Link>
    </>
  );
}

export default async function PaginaDelMenu() {
  const { cliente } = await exigirPagina('admin');
  const categorias = await leerPanel(cliente);
  return (
    <Pantalla
      titulo="Menú"
      subtitulo="Lo que ve el cliente en la carta: categorías, productos y precios."
      acciones={<Accesos />}
      ayuda="menu"
    >
      <AvisoDeFudo />
      {categorias.map((categoria) => (
        <TarjetaDeCategoria key={categoria.id} categoria={categoria} />
      ))}
      <Link
        href="/admin/menu/desactivados"
        className="inline-block text-sm font-semibold text-muted-foreground hover:text-primary"
      >
        Ver desactivados
      </Link>
    </Pantalla>
  );
}
