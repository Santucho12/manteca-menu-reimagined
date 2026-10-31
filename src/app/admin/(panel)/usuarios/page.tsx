import type { Metadata } from 'next';
import { Paginas } from '@/components/panel/Paginas';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { listarUsuarios } from '@/lib/usuarios/consultas';
import { filtrosDeLaUrl, type ParametrosDeUrl } from '@/lib/usuarios/pantalla';
import { cantidadDePaginas, enlaceDeUsuarios } from '@/lib/usuarios/presentacion';
import { Filtros } from './Filtros';
import { ListaDeUsuarios } from './ListaDeUsuarios';

export const metadata: Metadata = { title: 'Usuarios' };

type Props = { searchParams: Promise<ParametrosDeUrl> };

export default async function PaginaUsuarios({ searchParams }: Props) {
  const filtros = filtrosDeLaUrl(await searchParams);
  const { perfil, datos } = await exigirPaginaYLeer('admin', (cliente) =>
    listarUsuarios(cliente, filtros),
  );
  const { filas, total, pagina } = datos;
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
