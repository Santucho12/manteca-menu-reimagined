'use client';

import { motion } from 'framer-motion';
import { Receipt, ShoppingBag, Ticket, TrendingUp, type LucideIcon } from 'lucide-react';
import type { NumeroDelMes } from '@/lib/inicio/numeros';
import { colorDeTarjeta } from '@/lib/inicio/coloresDeTarjetas';
import { detalleDeTarjeta } from '@/lib/inicio/detallesDeTarjetas';
import { SOMBRA_DE_INICIO } from './sombraDeInicio';

const ICONOS: Record<string, LucideIcon> = {
  Ventas: ShoppingBag,
  Gastos: Receipt,
  Balance: TrendingUp,
  'Ticket promedio': Ticket,
};

const GRILLA = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const TARJETA = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

// El pie de FiestaCobra: qué muestra la tarjeta en pocas palabras y un punto de su color.
function PieDeTarjeta({ etiqueta, punto }: { etiqueta: string; punto: string }) {
  return (
    <div className="pt-3 md:pt-4 border-t border-slate-50 flex items-center justify-between gap-2">
      <span className="text-[9px] font-bold text-slate-400 uppercase leading-snug">
        {detalleDeTarjeta(etiqueta)}
      </span>
      <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${punto}`} />
    </div>
  );
}

/** Las tarjetas de numeros de FiestaCobra (Plan Reminder Pro): ventas, gastos, balance y ticket del mes. */
export function TarjetasDelMes({ items }: { items: NumeroDelMes[] }) {
  return (
    <motion.dl
      variants={GRILLA}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-3 md:gap-4"
    >
      {items.map((item) => {
        const Icono = ICONOS[item.etiqueta]!;
        const { borde, icono, punto } = colorDeTarjeta(item.etiqueta);
        return (
          <motion.div
            key={item.etiqueta}
            variants={TARJETA}
            className={`relative overflow-hidden rounded-xl border ${borde} bg-white p-4 md:p-6 flex flex-col ${SOMBRA_DE_INICIO}`}
          >
            <div className="flex justify-between items-start gap-2 relative z-10">
              <div className="space-y-1 min-w-0">
                <dt className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">
                  {item.etiqueta}
                </dt>
                <dd className="font-display text-xl sm:text-2xl 2xl:text-3xl font-bold tracking-tight text-slate-900 break-all">
                  {item.valor}
                </dd>
              </div>
              <div className={`shrink-0 rounded-lg p-1.5 md:p-2 ${icono} border ${borde}`}>
                <Icono size={18} aria-hidden="true" />
              </div>
            </div>
            <div className="mt-auto pt-4">
              <PieDeTarjeta etiqueta={item.etiqueta} punto={punto} />
            </div>
          </motion.div>
        );
      })}
    </motion.dl>
  );
}
