import type { Metadata } from 'next';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { exigirPagina } from '@/lib/acceso/servidor';
import { listarUsuarios } from '@/lib/usuarios/consultas';
import { filtrosDeLaUrl, type ParametrosDeUrl } from '@/lib/usuarios/pantalla';
import { Filtros } from './Filtros';
import { ListaDeUsuarios } from './ListaDeUsuarios';
import { Paginacion } from './Paginacion';

export const metadata: Metadata = { title: 'Usuarios' };

type Props = { searchParams: Promise<ParametrosDeUrl> };

export default async function PaginaUsuarios({ searchParams }: Props) {
  const { cliente, perfil } = await exigirPagina('admin');
  const filtros = filtrosDeLaUrl(await searchParams);
  const { filas, total, pagina } = await listarUsuarios(cliente, filtros);
  return (
    <div className="space-y-6">
      <TituloDePagina>Usuarios</TituloDePagina>
      <Filtros filtros={filtros} />
      <ListaDeUsuarios filas={filas} yo={perfil.id} />
      <Paginacion filtros={{ ...filtros, pagina }} total={total} />
    </div>
  );
}
