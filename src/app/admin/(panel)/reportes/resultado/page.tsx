import type { Metadata } from 'next';
import { PantallaDeReporte } from '@/components/reportes/PantallaDeReporte';
import { GraficoPorMes } from '@/components/reportes/GraficoPorMes';
import { SinDatos } from '@/components/reportes/SinDatos';
import { TablaComparada } from '@/components/reportes/TablaComparada';
import { Totales } from '@/components/reportes/Totales';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import { formatearPesos } from '@/lib/plata';
import { compararFilas } from '@/lib/reportes/comparacion';
import { datosDelResultado } from '@/lib/reportes/consultas';
import { periodosDelReporte, type ParametrosDeReporte } from '@/lib/reportes/periodos';
import {
  comparacionDelResultado,
  resultadoPorMes,
  type ResultadoDelPeriodo,
} from '@/lib/reportes/resultado';

export const metadata: Metadata = { title: 'Balance' };
const RUTA = '/admin/reportes/resultado';

type Props = { actual: ResultadoDelPeriodo; anterior: ResultadoDelPeriodo | null };

function TotalesDelResultado({ actual, anterior }: Props) {
  const c = comparacionDelResultado(actual, anterior);
  const resultado = actual.resultadoCentavos;
  return (
    <Totales
      items={[
        { etiqueta: 'Ventas', valor: formatearPesos(actual.ventasCentavos), variacion: c.ventas },
        { etiqueta: 'Gastos', valor: formatearPesos(actual.gastosCentavos), variacion: c.gastos },
        {
          etiqueta: 'Balance',
          valor: resultado === null ? 'Sin calcular' : formatearPesos(resultado),
          variacion: c.resultado,
        },
      ]}
    />
  );
}

function GastosPorCategoria({ actual, anterior }: Props) {
  const filas = compararFilas(
    actual.categorias,
    anterior?.categorias ?? null,
    (c) => c.clave,
    (c) => c.montoCentavos,
  );
  return (
    <TablaComparada
      titulo="Gastos por categoría"
      filas={filas.map(({ fila, variacion }) => ({ ...fila, variacion }))}
    />
  );
}

export default async function ReporteDeResultado({
  searchParams,
}: {
  searchParams: Promise<ParametrosDeReporte>;
}) {
  const hoy = diaEnArgentina(new Date());
  const periodos = periodosDelReporte(await searchParams, hoy);
  const { datos } = await exigirPaginaYLeer('admin', (cliente) =>
    Promise.all([
      datosDelResultado(cliente, periodos.actual),
      datosDelResultado(cliente, periodos.comparacion),
    ]),
  );
  const [actual, anterior] = datos;
  const otro = anterior.vacio ? null : anterior.resultado;
  return (
    <PantallaDeReporte titulo="Balance" ruta={RUTA} periodos={periodos} hoy={hoy}>
      {actual.vacio ? (
        <SinDatos>No hay ventas ni gastos en este período.</SinDatos>
      ) : (
        <>
          <TotalesDelResultado actual={actual.resultado} anterior={otro} />
          {actual.resultado.resultadoCentavos === null ? (
            <SinDatos>Sin gastos cargados: el balance no se calcula.</SinDatos>
          ) : null}
          <GraficoPorMes datos={resultadoPorMes(actual.ventas, actual.gastos)} />
          {actual.gastos.length ? (
            <GastosPorCategoria actual={actual.resultado} anterior={otro} />
          ) : null}
        </>
      )}
    </PantallaDeReporte>
  );
}
