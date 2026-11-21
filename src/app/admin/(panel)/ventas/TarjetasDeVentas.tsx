import { Ban, Ticket, Wallet, XCircle, type LucideIcon } from 'lucide-react';
import { SOMBRA_DE_INICIO } from '@/components/inicio/sombraDeInicio';
import type { Totales } from '@/lib/ventas/consultas';
import { tarjetasDelResumen } from '@/lib/ventas/pantalla';
import { colorDeTarjeta } from '@/lib/inicio/coloresDeTarjetas';

const ICONOS: Record<string, LucideIcon> = {
  Cobrado: Wallet,
  'Ticket promedio': Ticket,
  Canceladas: XCircle,
  Anuladas: Ban,
};

// El pie de las tarjetas de Inicio: qué muestra en pocas palabras y un punto de su color.
function Pie({ detalle, punto }: { detalle: string; punto: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 md:pt-4">
      <span className="text-[9px] font-bold uppercase leading-snug text-slate-400">{detalle}</span>
      <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${punto}`} />
    </div>
  );
}

/** El resumen del periodo con las tarjetas de Inicio: lo cobrado, el ticket y lo anulado. */
export function TarjetasDeVentas({ totales }: { totales: Totales }) {
  return (
    <section aria-label="Resumen de ventas">
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-3 md:gap-4">
        {tarjetasDelResumen(totales).map(({ etiqueta, valor, detalle, ayuda }) => {
          const Icono = ICONOS[etiqueta]!;
          const { borde, icono, punto } = colorDeTarjeta(etiqueta);
          return (
            <li
              key={etiqueta}
              className={`relative flex flex-col overflow-hidden rounded-xl border ${borde} bg-white p-4 md:p-6 ${SOMBRA_DE_INICIO}`}
            >
              <dl className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <dt className="text-[10px] font-bold uppercase leading-tight tracking-widest text-slate-500">
                    {etiqueta}
                  </dt>
                  <dd className="font-display text-xl font-bold tracking-tight break-all text-slate-900 sm:text-2xl 2xl:text-3xl">
                    {valor}
                  </dd>
                  {ayuda ? (
                    <p className="pt-1 text-[11px] leading-snug text-muted-foreground/80">
                      {ayuda}
                    </p>
                  ) : null}
                </div>
                <div className={`shrink-0 rounded-lg border p-1.5 md:p-2 ${icono} ${borde}`}>
                  <Icono size={18} aria-hidden="true" />
                </div>
              </dl>
              <div className="mt-auto pt-4">
                <Pie detalle={detalle} punto={punto} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
