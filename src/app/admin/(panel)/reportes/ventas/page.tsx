import type { Metadata } from 'next';
import { EncabezadoDeReporte } from '@/components/reportes/EncabezadoDeReporte';
import { GraficoDeLineas } from '@/components/reportes/GraficoDeLineas';
import { Paginas } from '@/components/reportes/Paginas';
import { SinDatos } from '@/components/reportes/SinDatos';
import { TablaPorPeriodo } from '@/components/reportes/TablaPorPeriodo';
import { Totales } from '@/components/reportes/Totales';
import { exigirPagina } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import { formatearPesos } from '@/lib/plata';
import { agrupar, escalaDe, serieSuperpuesta } from '@/lib/reportes/agrupar';
import { variacion } from '@/lib/reportes/comparacion';
import { ventasPorDia } from '@/lib/reportes/consultas';
import { paginaDe } from '@/lib/reportes/paginas';
import { periodosDelReporte, type ParametrosDeReporte } from '@/lib/reportes/periodos';
import { puntosDeVentas, totalesDeVentas, type VentaDelDia } from '@/lib/reportes/ventas';

export const metadata: Metadata = { title: 'Ventas por período' };
const RUTA = '/admin/reportes/ventas';

function TotalesDeVentas({ actual, anterior }: { actual: VentaDelDia[]; anterior: VentaDelDia[] }) {
  const a = totalesDeVentas(actual);
  const b = anterior.length ? totalesDeVentas(anterior) : null;
  return (
    <Totales
      items={[
        {
          etiqueta: 'Ventas',
          valor: formatearPesos(a.montoCentavos),
          variacion: variacion(a.montoCentavos, b?.montoCentavos ?? null),
        },
        { etiqueta: 'Cantidad de ventas', valor: String(a.ventas) },
        {
          etiqueta: 'Ticket promedio',
          valor: formatearPesos(a.ticketCentavos ?? 0),
          variacion: variacion(a.ticketCentavos ?? 0, b?.ticketCentavos ?? null),
        },
      ]}
    />
  );
}

export default async function ReporteDeVentas({
  searchParams,
}: {
  searchParams: Promise<ParametrosDeReporte>;
}) {
  const { cliente } = await exigirPagina('admin');
  const hoy = diaEnArgentina(new Date());
  const periodos = periodosDelReporte(await searchParams, hoy);
  const [actual, anterior] = await Promise.all([
    ventasPorDia(cliente, periodos.actual),
    ventasPorDia(cliente, periodos.comparacion),
  ]);
  const escala = escalaDe(periodos.actual);
  const pagina = paginaDe(agrupar(puntosDeVentas(actual), escala), periodos.pagina);
  const serie = serieSuperpuesta(
    { periodo: periodos.actual, puntos: puntosDeVentas(actual) },
    { periodo: periodos.comparacion, puntos: puntosDeVentas(anterior) },
    escala,
    hoy,
  );
  return (
    <div className="space-y-6">
      <EncabezadoDeReporte titulo="Ventas por período" ruta={RUTA} periodos={periodos} hoy={hoy} />
      {actual.length === 0 ? (
        <SinDatos>No hay ventas en este período.</SinDatos>
      ) : (
        <>
          <TotalesDeVentas actual={actual} anterior={anterior} />
          <GraficoDeLineas datos={serie} />
          <TablaPorPeriodo filas={pagina.filas} escala={escala} conVentas />
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
