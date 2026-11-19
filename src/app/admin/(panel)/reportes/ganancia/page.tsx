import type { Metadata } from 'next';
import { PantallaDeReporte } from '@/components/reportes/PantallaDeReporte';
import { SinDatos } from '@/components/reportes/SinDatos';
import { Totales } from '@/components/reportes/Totales';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { textoDelPorcentaje } from '@/lib/costos/calculo';
import { diaEnArgentina } from '@/lib/fechas';
import { contenidoParaEditar } from '@/lib/materia-prima/esquemas';
import { formatearPesos } from '@/lib/plata';
import { gananciaPorProducto } from '@/lib/reportes/consultas';
import { filasDeGanancia, totalesDeGanancia, type FilaDeGanancia } from '@/lib/reportes/ganancia';
import { periodosDelReporte, type ParametrosDeReporte } from '@/lib/reportes/periodos';

export const metadata: Metadata = { title: 'Ganancia por producto' };
const RUTA = '/admin/reportes/ganancia';

function Fila({ fila }: { fila: FilaDeGanancia }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
      <div className="min-w-0">
        <p className="font-semibold wrap-break-word">{fila.producto}</p>
        <p className="text-xs text-muted-foreground">
          {contenidoParaEditar(fila.unidades)} vendidos · ventas{' '}
          {formatearPesos(fila.ventasCentavos)} · costo {formatearPesos(fila.costoCentavos)}
          {fila.sinCosto > 0 ? ` · ${fila.sinCosto} sin costo` : ''}
        </p>
      </div>
      <p className="font-bold whitespace-nowrap">
        <span className="sr-only">Ganancia: </span>
        {formatearPesos(fila.gananciaCentavos)}
        {fila.porcentaje === null ? null : (
          <span className="ml-2 text-xs text-muted-foreground">
            {textoDelPorcentaje(fila.porcentaje)}
          </span>
        )}
      </p>
    </li>
  );
}

export default async function ReporteDeGanancia({
  searchParams,
}: {
  searchParams: Promise<ParametrosDeReporte>;
}) {
  const hoy = diaEnArgentina(new Date());
  const periodos = periodosDelReporte(await searchParams, hoy);
  const { datos } = await exigirPaginaYLeer('admin', (c) =>
    gananciaPorProducto(c, periodos.actual),
  );
  const filas = filasDeGanancia(datos);
  const totales = totalesDeGanancia(filas);
  return (
    <PantallaDeReporte titulo="Ganancia por producto" ruta={RUTA} periodos={periodos} hoy={hoy}>
      {filas.length === 0 ? (
        <SinDatos>No hay ventas en este período.</SinDatos>
      ) : (
        <>
          <Totales
            items={[
              { etiqueta: 'Ventas', valor: formatearPesos(totales.ventasCentavos) },
              { etiqueta: 'Costo', valor: formatearPesos(totales.costoCentavos) },
              { etiqueta: 'Ganancia', valor: formatearPesos(totales.gananciaCentavos) },
            ]}
          />
          {totales.sinCosto > 0 ? (
            <p className="text-xs text-muted-foreground">
              {totales.sinCosto} {totales.sinCosto === 1 ? 'venta' : 'ventas'} sin costo: se
              vendieron cuando el producto no tenía receta o un insumo no tenía precio. No cuentan
              en el costo ni en la ganancia.
            </p>
          ) : null}
          <ul aria-label="Ganancia por producto" className="divide-y divide-border">
            {filas.map((fila) => (
              <Fila key={fila.clave} fila={fila} />
            ))}
          </ul>
        </>
      )}
    </PantallaDeReporte>
  );
}
