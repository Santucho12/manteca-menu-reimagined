import { Etiqueta, Panel } from '@/components/panel/Piezas';
import { textoDePresentaciones } from '@/lib/inicio/meses';
import { formatearPesos } from '@/lib/plata';
import type { ProductoDelReporte } from '@/lib/reportes/ventas';

/** Los 5 productos que mas plata dejaron en el mes, con la cantidad de cada presentacion. */
export function MasVendidos({
  productos,
  className = '',
}: {
  productos: ProductoDelReporte[];
  className?: string;
}) {
  return (
    <Panel
      etiquetadoPor="mas-vendidos"
      className={className}
      etiqueta={
        <Etiqueta as="h2" id="mas-vendidos">
          Más vendidos
        </Etiqueta>
      }
    >
      {productos.length === 0 ? (
        <p className="text-muted-foreground px-6 py-10 text-center">
          Todavía no hay ventas este mes.
        </p>
      ) : (
        <ol aria-label="Más vendidos">
          {productos.map((p) => (
            <li
              key={p.clave}
              className="flex items-start justify-between gap-3 border-b px-6 py-4 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="font-bold">{p.nombre}</p>
                <p className="text-muted-foreground text-sm">{textoDePresentaciones(p)}</p>
              </div>
              <span className="font-bold">{formatearPesos(p.montoCentavos)}</span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
