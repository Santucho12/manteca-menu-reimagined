import type { Metadata } from 'next';
import { Paginas } from '@/components/panel/Paginas';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPagina } from '@/lib/acceso/servidor';
import { listarUsuarios } from '@/lib/usuarios/consultas';
import { filtrosDeLaUrl, type ParametrosDeUrl } from '@/lib/usuarios/pantalla';
import { cantidadDePaginas, enlaceDeUsuarios } from '@/lib/usuarios/presentacion';
import { Filtros } from './Filtros';
import { ListaDeUsuarios } from './ListaDeUsuarios';

export const metadata: Metadata = { title: 'Usuarios' };

type Props = { searchParams: Promise<ParametrosDeUrl> };

export default async function PaginaUsuarios({ searchParams }: Props) {
  const { cliente, perfil } = await exigirPagina('admin');
  const filtros = filtrosDeLaUrl(await searchParams);
  const { filas, total, pagina } = await listarUsuarios(cliente, filtros);
  return (
    <Pantalla
      titulo="Usuarios"
      subtitulo="Quién entra al sistema y qué puede hacer."
      ayuda="usuarios"
    >
      <Filtros filtros={filtros} />
      <ListaDeUsuarios filas={filas} yo={perfil.id} />
      <Paginas
        pagina={pagina}
        ultima={cantidadDePaginas(total)}
        enlaceA={(numero) => enlaceDeUsuarios({ ...filtros, pagina: numero })}
      />
    </Pantalla>
  );
}
