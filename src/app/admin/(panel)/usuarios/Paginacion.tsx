import Link from 'next/link';
import {
  cantidadDePaginas,
  enlaceDeUsuarios,
  type FiltrosDeLista,
} from '@/lib/usuarios/presentacion';

export function Paginacion({ filtros, total }: { filtros: FiltrosDeLista; total: number }) {
  const paginas = cantidadDePaginas(total);
  if (paginas === 1) return null;
  const { pagina } = filtros;
  return (
    <nav aria-label="Páginas" className="flex items-center gap-4 text-sm">
      {pagina > 1 ? (
        <Link
          href={enlaceDeUsuarios({ ...filtros, pagina: pagina - 1 })}
          className="underline underline-offset-4"
        >
          Anterior
        </Link>
      ) : null}
      <span>
        Página {pagina} de {paginas}
      </span>
      {pagina < paginas ? (
        <Link
          href={enlaceDeUsuarios({ ...filtros, pagina: pagina + 1 })}
          className="underline underline-offset-4"
        >
          Siguiente
        </Link>
      ) : null}
    </nav>
  );
}
