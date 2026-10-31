import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { plantillaDePagina } from '@/lib/paginas';
import { ATAJO, CANTIDAD_DE_RESULTADOS } from './estilos';
import { SaltoDePagina } from './SaltoDePagina';

type Props = { pagina: number; ultima: number; enlaceA: (pagina: number) => string };

/** Plan Reminder Pro no pagina (extension): sus atajos y su chip de resultados. Con una pagina, nada. */
export function Paginas({ pagina, ultima, enlaceA }: Props) {
  if (ultima <= 1) return null;
  return (
    <nav aria-label="Páginas" className="flex flex-wrap items-center justify-center gap-2">
      {pagina > 1 ? (
        <Link href={enlaceA(pagina - 1)} className={ATAJO}>
          <ChevronLeft size={14} aria-hidden="true" /> Anterior
        </Link>
      ) : null}
      <span className={`px-2 py-1 bg-secondary rounded-md ${CANTIDAD_DE_RESULTADOS}`}>
        Página {pagina} de {ultima}
      </span>
      {pagina < ultima ? (
        <Link href={enlaceA(pagina + 1)} className={ATAJO}>
          Siguiente <ChevronRight size={14} aria-hidden="true" />
        </Link>
      ) : null}
      <SaltoDePagina ultima={ultima} plantilla={plantillaDePagina(enlaceA)} primera={enlaceA(1)} />
    </nav>
  );
}
