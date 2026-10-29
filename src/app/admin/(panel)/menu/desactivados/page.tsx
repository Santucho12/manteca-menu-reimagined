import type { Metadata } from 'next';
import Link from 'next/link';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { leerFilasDelMenu } from '@/lib/menu/consultas';
import { desactivados } from '@/lib/menu/panel';
import { ListaDeDesactivados } from './ListaDeDesactivados';

export const metadata: Metadata = { title: 'Desactivados del menú' };

export default async function PaginaDeDesactivados() {
  const { datos: filas } = await exigirPaginaYLeer('admin', leerFilasDelMenu);
  return (
    <Pantalla
      titulo="Desactivados del menú"
      subtitulo="Lo que reactivás vuelve oculto, al final de su lista, para que lo revises antes de mostrarlo."
      ayuda="menu"
    >
      <ListaDeDesactivados desactivados={desactivados(filas)} />
      <Link
        href="/admin/menu"
        className="inline-block text-sm font-semibold text-muted-foreground hover:text-primary"
      >
        Volver al menú
      </Link>
    </Pantalla>
  );
}
