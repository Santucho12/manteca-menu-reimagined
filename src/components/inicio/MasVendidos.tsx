import { EnlaceASeccion } from '@/components/panel/EnlaceASeccion';
import { textoDePresentaciones } from '@/lib/inicio/meses';
import { anchoDeBarra, puestoDeMasVendidos } from '@/lib/inicio/masVendidos';
import { formatearPesos } from '@/lib/plata';
import { EncabezadoDeTarjeta } from './EncabezadoDeTarjeta';
import type { ProductoDelReporte } from '@/lib/reportes/ventas';

/** Los 5 productos que mas plata dejaron en el mes, cada uno con su barra contra el primero. */
export function MasVendidos({ productos }: { productos: ProductoDelReporte[] }) {
  const primero = productos[0]?.montoCentavos ?? 0;
  return (
    <section
      aria-labelledby="mas-vendidos"
      className="h-full flex flex-col rounded-2xl border border-border bg-card p-6 md:p-8 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl hover:shadow-slate-200/50 transition-shadow duration-300"
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
          Todavía no hay ventas este mes.
        </p>
      ) : (
        <ol aria-label="Más vendidos" className="flex-1 flex flex-col justify-between gap-1">
          {productos.map((producto, posicion) => (
            <FilaDeProducto
              key={producto.clave}
              producto={producto}
              posicion={posicion}
              ancho={anchoDeBarra(producto.montoCentavos, primero)}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

type PropsDeFila = { producto: ProductoDelReporte; posicion: number; ancho: number };

/** Al pasar el mouse, el renglón se tiñe y su barra se llena de color. */
function FilaDeProducto({ producto, posicion, ancho }: PropsDeFila) {
  return (
    <li className="group -mx-3 flex items-center gap-4 rounded-xl px-3 py-3 transition-colors duration-200 hover:bg-slate-50">
      <Puesto posicion={posicion} />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold wrap-break-word">{producto.nombre}</p>
          <span className="shrink-0 font-display text-base font-bold tracking-tight tabular-nums text-slate-900">
            {formatearPesos(producto.montoCentavos)}
          </span>
        </div>
        <div aria-hidden="true" className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500/45 transition-colors duration-300 group-hover:bg-emerald-500"
            style={{ width: `${ancho}%` }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground wrap-break-word">
          {textoDePresentaciones(producto)}
        </p>
      </div>
    </li>
  );
}

/** Los tres primeros, con su medalla dibujada; del cuarto en adelante, el número en un círculo. */
function Puesto({ posicion }: { posicion: number }) {
  const { medalla, circulo } = puestoDeMasVendidos(posicion);
  if (medalla) return <Medalla posicion={posicion} medalla={medalla} />;
  return (
    <span
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border font-display text-sm font-bold tabular-nums transition-transform duration-200 group-hover:scale-110 ${circulo}`}
    >
      {posicion + 1}
    </span>
  );
}

type PropsDeMedalla = {
  posicion: number;
  medalla: NonNullable<ReturnType<typeof puestoDeMasVendidos>['medalla']>;
};

/** La medalla: dos cintas, el disco del metal y el puesto adentro. Quieta al pasar el mouse. */
function Medalla({ posicion, medalla }: PropsDeMedalla) {
  return (
    <svg role="img" aria-label={medalla.nombre} viewBox="0 0 32 36" className="h-9 w-8 shrink-0">
      <path d="M8 1h7l3 11-6 3z" className={medalla.cinta} />
      <path d="M24 1h-7l-3 11 6 3z" className={medalla.cinta} opacity="0.75" />
      <circle cx="16" cy="23" r="10" strokeWidth="2" className={medalla.disco} />
      <text
        x="16"
        y="27.5"
        textAnchor="middle"
        className={`font-display text-[12px] font-bold ${medalla.numero}`}
      >
        {posicion + 1}
      </text>
    </svg>
  );
}
