import { Paginas } from '@/components/panel/Paginas';
import { enlaceDeReporte, type PeriodosDelReporte } from '@/lib/reportes/periodos';

type Props = { ruta: string; periodos: PeriodosDelReporte; pagina: number; paginas: number };

/** Los enlaces de pagina de un reporte: conservan el periodo y la comparacion elegidos. */
export function PaginasDeReporte({ ruta, periodos, pagina, paginas }: Props) {
  const comparacion = periodos.comparacionElegida ? periodos.comparacion : null;
  return (
    <Paginas
      pagina={pagina}
      ultima={paginas}
      enlaceA={(numero) =>
        enlaceDeReporte(ruta, { actual: periodos.actual, comparacion, pagina: numero })
      }
    />
  );
}
