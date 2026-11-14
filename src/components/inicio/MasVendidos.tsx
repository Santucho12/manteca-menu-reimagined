import { EnlaceASeccion } from '@/components/panel/EnlaceASeccion';
import { notaDeMasVendidos } from '@/lib/inicio/masVendidos';
import { textoDePresentaciones } from '@/lib/inicio/meses';
import { formatearPesos } from '@/lib/plata';
import { EncabezadoDeTarjeta } from './EncabezadoDeTarjeta';
import type { ProductoDelReporte } from '@/lib/reportes/ventas';

const MEDALLAS = [
  { icono: '🥇', nombre: 'Medalla de oro' },
  { icono: '🥈', nombre: 'Medalla de plata' },
  { icono: '🥉', nombre: 'Medalla de bronce' },
];

/** Los 5 productos que mas plata dejaron en el mes: un panel chico de Plan Reminder Pro. */
export function MasVendidos({
  productos,
  sinDetalle,
}: {
  productos: ProductoDelReporte[];
  /** Ventas del mes sin productos (las del Excel de Fudo): no entran en la lista. */
  sinDetalle: number;
}) {
  const nota = notaDeMasVendidos(productos.length, sinDetalle);
  return (
    <section
      aria-labelledby="mas-vendidos"
      className="h-full flex flex-col rounded-2xl border border-border bg-card p-6 md:p-8"
    >
      <EncabezadoDeTarjeta
        titulo="Más vendidos"
        descripcion="Por lo que dejaron en el mes, no por unidades."
        id="mas-vendidos"
      >
        <EnlaceASeccion clave="costos" seccion="Costos" href="/admin/costos" texto="Ver costos" />
      </EncabezadoDeTarjeta>
      {productos.length === 0 ? (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {nota ?? 'Todavía no hay ventas este mes.'}
        </p>
      ) : (
        <ol aria-label="Más vendidos" className="flex-1 flex flex-col divide-y divide-border">
          {productos.map((producto, posicion) => (
            <li key={producto.clave} className="flex-1 py-3 flex items-center gap-3">
              <Puesto posicion={posicion} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold wrap-break-word">{producto.nombre}</p>
                <p className="text-[11px] text-muted-foreground wrap-break-word">
                  {textoDePresentaciones(producto)}
                </p>
              </div>
              <span className="shrink-0 text-sm font-bold tabular-nums">
                {formatearPesos(producto.montoCentavos)}
              </span>
            </li>
          ))}
        </ol>
      )}
      {productos.length > 0 && nota ? (
        <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">{nota}</p>
      ) : null}
    </section>
  );
}

/** Todos los puestos ocupan lo mismo, para que los nombres queden alineados. */
function Puesto({ posicion }: { posicion: number }) {
  const medalla = MEDALLAS[posicion];
  if (medalla) {
    return (
      <span role="img" aria-label={medalla.nombre} className="w-8 shrink-0 text-center text-xl">
        {medalla.icono}
      </span>
    );
  }
  return (
    <span className="w-8 shrink-0 flex justify-center">
      <span className="h-6 w-6 rounded-full bg-secondary text-[11px] font-bold text-muted-foreground flex items-center justify-center">
        {posicion + 1}
      </span>
    </span>
  );
}
