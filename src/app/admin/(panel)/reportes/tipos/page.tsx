import type { Metadata } from 'next';
import { GraficoDeBarras } from '@/components/reportes/GraficoDeBarras';
import { PaginasDeReporte } from '@/components/reportes/PaginasDeReporte';
import { PantallaDeReporte } from '@/components/reportes/PantallaDeReporte';
import { SinDatos } from '@/components/reportes/SinDatos';
import { TablaComparada } from '@/components/reportes/TablaComparada';
import { Totales } from '@/components/reportes/Totales';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import { formatearPesos } from '@/lib/plata';
import { compararFilas, variacion } from '@/lib/reportes/comparacion';
import { ventasPorTipo } from '@/lib/reportes/consultas';
import { paginaDe } from '@/lib/reportes/paginas';
import { periodosDelReporte, type ParametrosDeReporte } from '@/lib/reportes/periodos';
import { parteDelTotal, tiposDelReporte, type TipoDelReporte } from '@/lib/reportes/ventas';

export const metadata: Metadata = { title: 'Ventas por tipo de venta' };
const RUTA = '/admin/reportes/tipos';

const totalDe = (tipos: TipoDelReporte[]) => tipos.reduce((suma, t) => suma + t.montoCentavos, 0);

function ConParte({ nombre, parte }: { nombre: string; parte: number | null }) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <span>{nombre}</span>
      {parte === null ? null : <span className="text-xs text-muted-foreground">{parte} %</span>}
    </span>
  );
}

export default async function ReporteDeTipos({
  searchParams,
}: {
  searchParams: Promise<ParametrosDeReporte>;
}) {
  const hoy = diaEnArgentina(new Date());
  const periodos = periodosDelReporte(await searchParams, hoy);
  const { datos } = await exigirPaginaYLeer('admin', (cliente) =>
    Promise.all([
      ventasPorTipo(cliente, periodos.actual),
      ventasPorTipo(cliente, periodos.comparacion),
    ]),
  );
  const actual = tiposDelReporte(datos[0]);
  const anterior = tiposDelReporte(datos[1]);
  const total = totalDe(actual);
  const pagina = paginaDe(
    compararFilas(
      actual,
      anterior,
      (t) => t.clave,
      (t) => t.montoCentavos,
    ),
    periodos.pagina,
  );
  return (
    <PantallaDeReporte titulo="Ventas por tipo de venta" ruta={RUTA} periodos={periodos} hoy={hoy}>
      {actual.length === 0 ? (
        <SinDatos>No hay ventas en este período.</SinDatos>
      ) : (
        <>
          <Totales
            items={[
              {
                etiqueta: 'Ventas',
                valor: formatearPesos(total),
                variacion: variacion(total, anterior.length ? totalDe(anterior) : null),
              },
            ]}
          />
          <GraficoDeBarras datos={actual} />
          <TablaComparada
            titulo="Tipo de venta"
            tituloDeCantidad="Ventas"
            filas={pagina.filas.map(({ fila, variacion }) => ({
              clave: fila.clave,
              nombre: (
                <ConParte nombre={fila.nombre} parte={parteDelTotal(fila.montoCentavos, total)} />
              ),
              cantidad: fila.ventas,
              montoCentavos: fila.montoCentavos,
              variacion,
            }))}
          />
          <PaginasDeReporte
            ruta={RUTA}
            periodos={periodos}
            pagina={pagina.pagina}
            paginas={pagina.paginas}
          />
        </>
      )}
    </PantallaDeReporte>
  );
}
