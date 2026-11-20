import { Ban, Ticket, Wallet, XCircle, type LucideIcon } from 'lucide-react';
import type { Totales } from '@/lib/ventas/consultas';
import { tarjetasDelResumen } from '@/lib/ventas/pantalla';
import { colorDeTarjeta } from '@/lib/inicio/coloresDeTarjetas';

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
          const { borde, icono } = colorDeTarjeta(etiqueta);
          return (
            <li
              key={etiqueta}
              className={`relative overflow-hidden rounded-xl border ${borde} bg-white p-4 md:p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300`}
            >
              <dl className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <dt className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                    {etiqueta}
                  </dt>
                  <dd className="font-display text-xl sm:text-2xl 2xl:text-3xl font-bold tracking-tight text-slate-900 break-all">
                    {valor}
                  </dd>
                  <p className="pt-3 text-[9px] font-bold text-slate-400 uppercase leading-snug">
                    {detalle}
                  </p>
                  {ayuda ? (
                    <p className="pt-1 text-[11px] leading-snug text-muted-foreground/80">
                      {ayuda}
                    </p>
                  ) : null}
                </div>
                <div className={`shrink-0 rounded-lg p-1.5 md:p-2 ${icono} border ${borde}`}>
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
