'use client';

import { motion } from 'framer-motion';
import { Receipt, ShoppingBag, Ticket, TrendingUp, type LucideIcon } from 'lucide-react';
import { textoDeVariacion } from '@/lib/reportes/comparacion';
import { formatearPesosRedondeados } from '@/lib/plata';
import type { NumeroDelMes } from '@/lib/inicio/numeros';

// Un tono por dato, de la tabla de tarjetas de numeros de la skill estetica-panel.
const TONOS: Record<string, { icono: LucideIcon; borde: string; cuadro: string; punto: string }> = {
  Ventas: {
    icono: ShoppingBag,
    borde: 'border-emerald-100',
    cuadro: 'bg-emerald-50 text-emerald-600',
    punto: 'bg-emerald-600',
  },
  Gastos: {
    icono: Receipt,
    borde: 'border-rose-100',
    cuadro: 'bg-rose-50 text-rose-600',
    punto: 'bg-rose-600',
  },
  Balance: {
    icono: TrendingUp,
    borde: 'border-blue-100',
    cuadro: 'bg-blue-50 text-blue-600',
    punto: 'bg-blue-600',
  },
  'Ticket promedio': {
    icono: Ticket,
    borde: 'border-slate-100',
    cuadro: 'bg-slate-50 text-slate-600',
    punto: 'bg-slate-600',
  },
};

const GRILLA = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const TARJETA = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

/** Las tarjetas de numeros de Plan Reminder Pro: ventas, gastos, balance y ticket del mes. */
export function TarjetasDelMes({ items }: { items: NumeroDelMes[] }) {
  return (
    <motion.dl
      variants={GRILLA}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4"
    >
      {items.map((item) => {
        const { icono: Icono } = TONOS[item.etiqueta]!;
        return (
          <motion.div
            key={item.etiqueta}
            variants={TARJETA}
            className="relative overflow-hidden rounded-2xl border border-border bg-card p-3 md:px-6 md:pt-7 md:pb-6 flex flex-col shadow-[0_2px_10px_-4px_rgba(43,29,20,0.08)] hover:shadow-xl transition-all duration-300"
          >
            <span
              aria-hidden="true"
              className="absolute top-0 left-6 right-6 h-1 rounded-b-full bg-primary"
            />
            <div className="flex justify-between items-start gap-2 relative z-10">
              <div className="space-y-1 min-w-0">
                <dt className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                  {item.etiqueta}
                </dt>
                <dd className="text-sm md:text-lg xl:text-base 2xl:text-xl font-bold tracking-tight text-foreground break-all">
                  {item.valor}
                </dd>
              </div>
              <div className="shrink-0 rounded-xl p-1.5 md:p-2 bg-secondary text-foreground">
                <Icono size={18} aria-hidden="true" />
              </div>
            </div>
            <div className="mt-auto pt-6">
              <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase leading-snug">
                  {textoDeVariacion(item.variacion, formatearPesosRedondeados)}
                </span>
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.dl>
  );
}
