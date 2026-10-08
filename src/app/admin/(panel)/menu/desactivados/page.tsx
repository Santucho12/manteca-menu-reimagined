import type { Metadata } from 'next';
import Link from 'next/link';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { exigirPagina } from '@/lib/acceso/servidor';
import { leerFilasDelMenu } from '@/lib/menu/consultas';
import { desactivados } from '@/lib/menu/panel';
import { ListaDeDesactivados } from './ListaDeDesactivados';

export const metadata: Metadata = { title: 'Desactivados del menú' };

export default async function PaginaDeDesactivados() {
  const { cliente } = await exigirPagina('admin');
  const filas = await leerFilasDelMenu(cliente);
  return (
    <div className="space-y-6">
      <TituloDePagina>Desactivados del menú</TituloDePagina>
      <p className="text-muted-foreground text-sm">
        Lo que reactivás vuelve oculto, al final de su lista, para que lo revises antes de
        mostrarlo.
      </p>
      <ListaDeDesactivados desactivados={desactivados(filas)} />
      <Link href="/admin/menu" className="inline-block py-2 text-sm underline underline-offset-4">
        Volver al menú
      </Link>
    </div>
  );
}
