'use client';

import { motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  Receipt,
  ShoppingBag,
  Ticket,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import {
  estadoDeVariacion,
  flechaDeVariacion,
  type EstadoDeVariacion,
} from '@/lib/inicio/estadoDeVariacion';
import { textoDeVariacion } from '@/lib/reportes/comparacion';
import { formatearPesosRedondeados } from '@/lib/plata';
import type { NumeroDelMes } from '@/lib/inicio/numeros';
import { colorDeTarjeta } from '@/lib/inicio/coloresDeTarjetas';

const ICONOS: Record<string, LucideIcon> = {
  Ventas: ShoppingBag,
  Gastos: Receipt,
  Balance: TrendingUp,
  'Ticket promedio': Ticket,
};

// Verde si mejora y rojo si empeora (Santiago, 2026-10-27, pedido 47).
const COLORES: Record<EstadoDeVariacion, string> = {
  mejora: 'text-emerald-600',
  empeora: 'text-rose-600',
  igual: 'text-muted-foreground',
  'sin-datos': 'text-muted-foreground',
};

const GRILLA = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const TARJETA = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

function VariacionDelMes({ item }: { item: NumeroDelMes }) {
  const flecha = flechaDeVariacion(item.variacion);
  const color = COLORES[estadoDeVariacion(item.etiqueta, item.variacion)];
  const Flecha = flecha === 'sube' ? ArrowUp : ArrowDown;
  return (
    <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-2">
      <span className={`text-xs font-bold uppercase leading-snug ${color}`}>
        {textoDeVariacion(item.variacion, formatearPesosRedondeados)}
      </span>
      {flecha ? (
        <Flecha
          size={14}
          strokeWidth={2.6}
          aria-hidden="true"
          data-testid={`flecha-${flecha}`}
          className={`shrink-0 ${color}`}
        />
      ) : null}
    </div>
  );
}

/** Las tarjetas de numeros de Plan Reminder Pro: ventas, gastos, balance y ticket del mes. */
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
        const { raya, icono } = colorDeTarjeta(item.etiqueta);
        return (
          <motion.div
            key={item.etiqueta}
            variants={TARJETA}
            className="relative overflow-hidden rounded-2xl border border-border bg-card p-3 md:px-6 md:pt-7 md:pb-6 flex flex-col shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl transition-all duration-300"
          >
            <span
              aria-hidden="true"
              className={`absolute top-0 left-6 right-6 h-1 rounded-b-full ${raya}`}
            />
            <div className="flex justify-between items-start gap-2 relative z-10">
              <div className="space-y-1 min-w-0">
                <dt className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">
                  {item.etiqueta}
                </dt>
                <dd className="text-sm md:text-lg xl:text-base 2xl:text-xl font-bold tracking-tight text-foreground break-all">
                  {item.valor}
                </dd>
              </div>
              <div className={`shrink-0 rounded-xl p-1.5 md:p-2 ${icono}`}>
                <Icono size={18} aria-hidden="true" />
              </div>
            </div>
            <div className="mt-auto pt-6">
              <VariacionDelMes item={item} />
            </div>
          </motion.div>
        );
      })}
    </motion.dl>
  );
}
