'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Wallet } from 'lucide-react';
import {
  porcionDelResultado,
  textoDeLaPorcion,
  textoDeVentasDelMes,
} from '@/lib/inicio/bloqueDelMes';
import { formatearPesos } from '@/lib/plata';
import type { ResultadoDelPeriodo } from '@/lib/reportes/resultado';

// Los grises fríos de antes, fijos: los del panel ahora son cálidos (excepción de Santiago, pedido 102).
const ETIQUETA = 'text-[#64748b] text-xs font-bold uppercase tracking-widest';

type Props = { resultado: ResultadoDelPeriodo; cantidad: number };

/** El bloque oscuro del mes, en su azul casi negro de siempre (Santiago, pedido 102), con las ventas del mes. */
export function BloqueDelMes({ resultado, cantidad }: Props) {
  const porcion = porcionDelResultado(resultado);
  const final = resultado.resultadoCentavos;
  return (
    <motion.section
      aria-label="Ventas del mes"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="h-full relative overflow-hidden rounded-2xl bg-[#0F172A] border border-[#1e293b] shadow-2xl p-6 md:px-8 md:py-9"
    >
      <div className="relative z-10 flex flex-col gap-9">
        <div className="space-y-6 min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5">
            <div className="flex items-center justify-center text-emerald-400">
              <TrendingUp size={14} aria-hidden="true" />
            </div>
            <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-[0.2em]">
              Ventas del mes
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-[#64748b] text-sm font-medium">{textoDeVentasDelMes(cantidad)}</p>
            <p className="text-3xl md:text-4xl font-extrabold tracking-tighter text-white font-display break-words">
              {formatearPesos(resultado.ventasCentavos)}
            </p>
          </div>
        </div>
        <div className="w-full space-y-5 p-5 md:p-6 rounded-xl bg-[#0f172a]/50 border border-[#1e293b]/50">
          <div className="grid grid-cols-2 gap-4 md:w-2/3">
            <div>
              <p className={ETIQUETA}>Gastos</p>
              <p className="text-white font-bold text-sm md:text-base break-all">
                {formatearPesos(resultado.gastosCentavos)}
              </p>
            </div>
            <div>
              <p className={ETIQUETA}>Balance</p>
              <p className="text-white font-bold text-sm md:text-base break-all">
                {final === null ? 'Sin calcular' : formatearPesos(final)}
              </p>
            </div>
          </div>
          <Avance porcion={porcion} />
        </div>
      </div>
      <div className="absolute top-0 right-0 h-full w-1/3 bg-linear-to-l/srgb from-emerald-500/5 to-transparent pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <Wallet size={120} strokeWidth={0.5} aria-hidden="true" />
      </div>
    </motion.section>
  );
}

function Avance({ porcion }: { porcion: number | null }) {
  return (
    <div className="space-y-2">
      {porcion === null ? null : (
        <div className="h-2.5 w-full bg-[#1e293b] rounded-full overflow-hidden p-0.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${porcion}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="h-full bg-linear-to-r/srgb from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"
          />
        </div>
      )}
      <p className="text-xs text-[#64748b] leading-relaxed">{textoDeLaPorcion(porcion)}</p>
    </div>
  );
}
