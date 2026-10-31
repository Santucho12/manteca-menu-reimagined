import type { Metadata } from 'next';
import { PantallaDeReporte } from '@/components/reportes/PantallaDeReporte';
import { GraficoDeBarras } from '@/components/reportes/GraficoDeBarras';
import { PaginasDeReporte } from '@/components/reportes/PaginasDeReporte';
import { SinDatos } from '@/components/reportes/SinDatos';
import { TablaComparada } from '@/components/reportes/TablaComparada';
import { Totales } from '@/components/reportes/Totales';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import { formatearPesos } from '@/lib/plata';
import { compararFilas, variacion } from '@/lib/reportes/comparacion';
import { ventasPorCategoria } from '@/lib/reportes/consultas';
import { paginaDe } from '@/lib/reportes/paginas';
import { periodosDelReporte, type ParametrosDeReporte } from '@/lib/reportes/periodos';
import { categoriasDelReporte, type CategoriaDelReporte } from '@/lib/reportes/ventas';

export const metadata: Metadata = { title: 'Ventas por categoría' };
const RUTA = '/admin/reportes/categorias';

const totalDe = (categorias: CategoriaDelReporte[]) =>
  categorias.reduce((suma, c) => suma + c.montoCentavos, 0);

export default async function ReporteDeCategorias({
  searchParams,
}: {
  searchParams: Promise<ParametrosDeReporte>;
}) {
  const hoy = diaEnArgentina(new Date());
  const periodos = periodosDelReporte(await searchParams, hoy);
  const { datos } = await exigirPaginaYLeer('admin', (cliente) =>
    Promise.all([
      ventasPorCategoria(cliente, periodos.actual),
      ventasPorCategoria(cliente, periodos.comparacion),
    ]),
  );
  const [actual, anterior] = datos.map(categoriasDelReporte) as [
    CategoriaDelReporte[],
    CategoriaDelReporte[],
  ];
  const pagina = paginaDe(
    compararFilas(
      actual,
      anterior,
      (c) => c.clave,
      (c) => c.montoCentavos,
    ),
    periodos.pagina,
  );
  return (
    <PantallaDeReporte titulo="Ventas por categoría" ruta={RUTA} periodos={periodos} hoy={hoy}>
      {actual.length === 0 ? (
        <SinDatos>No hay ventas en este período.</SinDatos>
      ) : (
        <>
          <Totales
            items={[
              {
                etiqueta: 'Ventas',
                valor: formatearPesos(totalDe(actual)),
                variacion: variacion(totalDe(actual), anterior.length ? totalDe(anterior) : null),
              },
            ]}
          />
          <GraficoDeBarras datos={actual} />
          <TablaComparada
            titulo="Categoría"
            tituloDeCantidad="Ventas"
            filas={pagina.filas.map(({ fila, variacion }) => ({
              clave: fila.clave,
              nombre: fila.nombre,
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
