import type { Metadata } from 'next';
import { EncabezadoDeReporte } from '@/components/reportes/EncabezadoDeReporte';
import { GraficoDeBarras } from '@/components/reportes/GraficoDeBarras';
import { Paginas } from '@/components/reportes/Paginas';
import { SinDatos } from '@/components/reportes/SinDatos';
import { TablaComparada } from '@/components/reportes/TablaComparada';
import { Totales } from '@/components/reportes/Totales';
import { exigirPagina } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import { formatearPesos } from '@/lib/plata';
import { compararFilas, variacion } from '@/lib/reportes/comparacion';
import { gastosPorDia } from '@/lib/reportes/consultas';
import { gastosPorCategoria, totalDeGastos } from '@/lib/reportes/gastos';
import { paginaDe } from '@/lib/reportes/paginas';
import { periodosDelReporte, type ParametrosDeReporte } from '@/lib/reportes/periodos';

export const metadata: Metadata = { title: 'Gastos por categoría' };
const RUTA = '/admin/reportes/gastos';

export default async function ReporteDeGastos({
  searchParams,
}: {
  searchParams: Promise<ParametrosDeReporte>;
}) {
  const { cliente } = await exigirPagina('admin');
  const hoy = diaEnArgentina(new Date());
  const periodos = periodosDelReporte(await searchParams, hoy);
  const [actual, anterior] = await Promise.all([
    gastosPorDia(cliente, periodos.actual),
    gastosPorDia(cliente, periodos.comparacion),
  ]);
  const categorias = gastosPorCategoria(actual);
  const pagina = paginaDe(
    compararFilas(
      categorias,
      gastosPorCategoria(anterior),
      (c) => c.clave,
      (c) => c.montoCentavos,
    ),
    periodos.pagina,
  );
  const anteriorTotal = anterior.length ? totalDeGastos(anterior) : null;
  return (
    <div className="space-y-6">
      <EncabezadoDeReporte
        titulo="Gastos por categoría"
        ruta={RUTA}
        periodos={periodos}
        hoy={hoy}
      />
      {actual.length === 0 ? (
        <SinDatos>No hay gastos en este período.</SinDatos>
      ) : (
        <>
          <Totales
            items={[
              {
                etiqueta: 'Gastos',
                valor: formatearPesos(totalDeGastos(actual)),
                variacion: variacion(totalDeGastos(actual), anteriorTotal),
              },
            ]}
          />
          <GraficoDeBarras datos={categorias} />
          <TablaComparada
            titulo="Categoría"
            filas={pagina.filas.map(({ fila, variacion }) => ({ ...fila, variacion }))}
          />
          <Paginas
            ruta={RUTA}
            periodos={periodos}
            pagina={pagina.pagina}
            paginas={pagina.paginas}
          />
        </>
      )}
    </div>
  );
}
