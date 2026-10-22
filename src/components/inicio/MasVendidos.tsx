import { textoDePresentaciones } from '@/lib/inicio/meses';
import { formatearPesos } from '@/lib/plata';
import type { ProductoDelReporte } from '@/lib/reportes/ventas';

/** Los 5 productos que mas plata dejaron en el mes: un panel chico de Plan Reminder Pro. */
export function MasVendidos({ productos }: { productos: ProductoDelReporte[] }) {
  return (
    <section
      aria-labelledby="mas-vendidos"
      className="rounded-2xl border border-border bg-card p-5 md:p-6"
    >
      <h2
        id="mas-vendidos"
        className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 font-sans"
      >
        Más vendidos
      </h2>
      {productos.length === 0 ? (
        <p className="text-sm text-muted-foreground leading-relaxed">
          Todavía no hay ventas este mes.
        </p>
      ) : (
        <ol aria-label="Más vendidos" className="divide-y divide-border">
          {productos.map((producto) => (
            <li key={producto.clave} className="py-2 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{producto.nombre}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {textoDePresentaciones(producto)}
                </p>
              </div>
              <span className="text-xs font-bold">{formatearPesos(producto.montoCentavos)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
