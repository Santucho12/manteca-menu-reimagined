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
import { ventasPorProducto, ventasSinDetalle } from '@/lib/reportes/consultas';
import { paginaDe } from '@/lib/reportes/paginas';
import { periodosDelReporte, type ParametrosDeReporte } from '@/lib/reportes/periodos';
import { productosDelReporte, type ProductoDelReporte } from '@/lib/reportes/ventas';
import { cantidadParaMostrar } from '@/lib/ventas/renglones';

export const metadata: Metadata = { title: 'Ventas por producto' };
const RUTA = '/admin/reportes/productos';

const totalDe = (productos: ProductoDelReporte[]) =>
  productos.reduce((suma, p) => suma + p.montoCentavos, 0);

function NombreConDetalle({ producto }: { producto: ProductoDelReporte }) {
  return (
    <div className="space-y-1">
      <p className="font-medium">{producto.nombre}</p>
      <ul className="text-muted-foreground text-sm">
        {producto.presentaciones.map((p, i) => (
          <li key={`${p.nombre}-${i}`}>
            {cantidadParaMostrar(p.cantidad)} × {p.nombre || 'Sin presentación'} ·{' '}
            {formatearPesos(p.montoCentavos)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function ReporteDeProductos({
  searchParams,
}: {
  searchParams: Promise<ParametrosDeReporte>;
}) {
  const hoy = diaEnArgentina(new Date());
  const periodos = periodosDelReporte(await searchParams, hoy);
  const { datos } = await exigirPaginaYLeer('admin', (cliente) =>
    Promise.all([
      ventasPorProducto(cliente, periodos.actual),
      ventasPorProducto(cliente, periodos.comparacion),
      ventasSinDetalle(cliente, periodos.actual),
      ventasSinDetalle(cliente, periodos.comparacion),
    ]),
  );
  const actual = productosDelReporte(datos[0], datos[2]);
  const anterior = productosDelReporte(datos[1], datos[3]);
  const comparadas = compararFilas(
    actual,
    anterior,
    (p) => p.clave,
    (p) => p.montoCentavos,
  );
  const pagina = paginaDe(comparadas, periodos.pagina);
  return (
    <PantallaDeReporte titulo="Ventas por producto" ruta={RUTA} periodos={periodos} hoy={hoy}>
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
            titulo="Producto"
            filas={pagina.filas.map(({ fila, variacion }) => ({
              clave: fila.clave,
              nombre: <NombreConDetalle producto={fila} />,
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
