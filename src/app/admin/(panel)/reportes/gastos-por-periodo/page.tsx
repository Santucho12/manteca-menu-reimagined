import type { Metadata } from 'next';
import { PantallaDeReporte } from '@/components/reportes/PantallaDeReporte';
import { GraficoDeLineas } from '@/components/reportes/GraficoDeLineas';
import { PaginasDeReporte } from '@/components/reportes/PaginasDeReporte';
import { SinDatos } from '@/components/reportes/SinDatos';
import { TablaPorPeriodo } from '@/components/reportes/TablaPorPeriodo';
import { Totales } from '@/components/reportes/Totales';
import { exigirPagina } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import { formatearPesos } from '@/lib/plata';
import { agrupar, escalaDe, serieSuperpuesta } from '@/lib/reportes/agrupar';
import { variacion } from '@/lib/reportes/comparacion';
import { gastosPorDia } from '@/lib/reportes/consultas';
import { puntosDeGastos, totalDeGastos } from '@/lib/reportes/gastos';
import { paginaDe } from '@/lib/reportes/paginas';
import { periodosDelReporte, type ParametrosDeReporte } from '@/lib/reportes/periodos';

export const metadata: Metadata = { title: 'Gastos por período' };
const RUTA = '/admin/reportes/gastos-por-periodo';

export default async function ReporteDeGastosPorPeriodo({
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
  const escala = escalaDe(periodos.actual);
  const pagina = paginaDe(agrupar(puntosDeGastos(actual), escala), periodos.pagina);
  const serie = serieSuperpuesta(
    { periodo: periodos.actual, puntos: puntosDeGastos(actual) },
    { periodo: periodos.comparacion, puntos: puntosDeGastos(anterior) },
    escala,
    hoy,
  );
  const anteriorTotal = anterior.length ? totalDeGastos(anterior) : null;
  return (
    <PantallaDeReporte titulo="Gastos por período" ruta={RUTA} periodos={periodos} hoy={hoy}>
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
          <GraficoDeLineas datos={serie} />
          <TablaPorPeriodo filas={pagina.filas} escala={escala} />
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
