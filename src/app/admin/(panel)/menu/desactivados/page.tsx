import { EnlaceDeVolver } from '@/components/panel/EnlaceDeVolver';
import type { Metadata } from 'next';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPagina } from '@/lib/acceso/servidor';
import { leerFilasDelMenu } from '@/lib/menu/consultas';
import { desactivados } from '@/lib/menu/panel';
import { ListaDeDesactivados } from './ListaDeDesactivados';

export const metadata: Metadata = { title: 'Desactivados del menú' };

export default async function PaginaDeDesactivados() {
  const { cliente } = await exigirPagina('admin');
  const filas = await leerFilasDelMenu(cliente);
  return (
    <Pantalla
      titulo="Desactivados del menú"
      subtitulo="Lo que reactivás vuelve oculto, al final de su lista, para que lo revises antes de mostrarlo."
      ayuda="menu"
    >
      <ListaDeDesactivados desactivados={desactivados(filas)} />
      <EnlaceDeVolver href="/admin/menu">Volver al menú</EnlaceDeVolver>
    </Pantalla>
  );
}
