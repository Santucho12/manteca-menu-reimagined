import { Ban, Ticket, Wallet, XCircle, type LucideIcon } from 'lucide-react';
import type { Totales } from '@/lib/ventas/consultas';
import { tarjetasDelResumen } from '@/lib/ventas/pantalla';

const ICONOS: Record<string, LucideIcon> = {
  Cobrado: Wallet,
  'Ticket promedio': Ticket,
  Canceladas: XCircle,
  Anuladas: Ban,
};

/** El resumen del periodo en tarjetas, como las de Inicio: lo cobrado y lo que no cuenta. */
export function TarjetasDeVentas({ totales }: { totales: Totales }) {
  return (
    <section aria-label="Resumen de ventas">
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-3 md:gap-4">
        {tarjetasDelResumen(totales).map(({ etiqueta, valor, detalle, ayuda }) => {
          const Icono = ICONOS[etiqueta]!;
          return (
            <li
              key={etiqueta}
              className="relative overflow-hidden rounded-2xl border border-border bg-card p-3 md:px-6 md:pt-7 md:pb-5 shadow-[0_2px_10px_-4px_rgba(43,29,20,0.08)]"
            >
              <span
                aria-hidden="true"
                className="absolute top-0 left-6 right-6 h-1 rounded-b-full bg-primary"
              />
              <dl className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <dt className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                    {etiqueta}
                  </dt>
                  <dd className="text-sm md:text-lg xl:text-base 2xl:text-xl font-bold tracking-tight text-foreground break-all">
                    {valor}
                  </dd>
                  <p className="text-xs text-muted-foreground">{detalle}</p>
                  {ayuda ? (
                    <p className="pt-1 text-[11px] leading-snug text-muted-foreground/80">
                      {ayuda}
                    </p>
                  ) : null}
                </div>
                <div className="shrink-0 rounded-xl p-1.5 md:p-2 bg-secondary text-foreground">
                  <Icono size={18} aria-hidden="true" />
                </div>
              </dl>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
