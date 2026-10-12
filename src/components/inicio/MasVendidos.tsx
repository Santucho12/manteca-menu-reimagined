import { textoDePresentaciones } from '@/lib/inicio/meses';
import { formatearPesos } from '@/lib/plata';
import type { ProductoDelReporte } from '@/lib/reportes/ventas';

/** Los 5 productos que mas plata dejaron en el mes, con la cantidad de cada presentacion. */
export function MasVendidos({ productos }: { productos: ProductoDelReporte[] }) {
  return (
    <section aria-labelledby="mas-vendidos" className="space-y-2">
      <h2 id="mas-vendidos" className="font-heading text-xl font-semibold">
        Más vendidos
      </h2>
      {productos.length === 0 ? (
        <p className="text-muted-foreground">Todavía no hay ventas este mes.</p>
      ) : (
        <ol aria-label="Más vendidos" className="bg-card divide-y rounded-xl border">
          {productos.map((p) => (
            <li key={p.clave} className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium">{p.nombre}</p>
                <p className="text-muted-foreground text-sm">{textoDePresentaciones(p)}</p>
              </div>
              <span className="font-medium">{formatearPesos(p.montoCentavos)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
