import Link from 'next/link';
import { enlaceDeReporte, type PeriodosDelReporte } from '@/lib/reportes/periodos';

type Props = { ruta: string; periodos: PeriodosDelReporte; pagina: number; paginas: number };

export function Paginas({ ruta, periodos, pagina, paginas }: Props) {
  if (paginas === 1) return null;
  const a = (numero: number) =>
    enlaceDeReporte(ruta, {
      actual: periodos.actual,
      comparacion: periodos.comparacionElegida ? periodos.comparacion : null,
      pagina: numero,
    });
  return (
    <nav aria-label="Páginas" className="flex items-center gap-4 text-sm">
      {pagina > 1 ? <Link href={a(pagina - 1)}>Anterior</Link> : null}
      <span>
        Página {pagina} de {paginas}
      </span>
      {pagina < paginas ? <Link href={a(pagina + 1)}>Siguiente</Link> : null}
    </nav>
  );
}
