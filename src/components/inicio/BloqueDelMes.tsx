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

const ETIQUETA = 'text-slate-500 text-[10px] font-bold uppercase tracking-widest';

type Props = { resultado: ResultadoDelPeriodo; cantidad: number };

/** El bloque oscuro de Plan Reminder Pro ("Cobranza del mes"), con las ventas del mes. */
export function BloqueDelMes({ resultado, cantidad }: Props) {
  const porcion = porcionDelResultado(resultado);
  const final = resultado.resultadoCentavos;
  return (
    <motion.section
      aria-label="Ventas del mes"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-[#0F172A] border border-slate-800 shadow-2xl p-5 md:p-8"
    >
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-4 min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TrendingUp size={16} aria-hidden="true" />
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              Ventas del mes
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-slate-500 text-sm font-medium">{textoDeVentasDelMes(cantidad)}</p>
            <p className="text-4xl md:text-6xl font-extrabold tracking-tighter text-white font-display break-words">
              {formatearPesos(resultado.ventasCentavos)}
            </p>
          </div>
        </div>
        <div className="w-full md:w-80 space-y-4 p-5 rounded-xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-xs">
          <div className="grid grid-cols-2 gap-4">
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
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${porcion}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="h-full bg-linear-to-r/srgb from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"
          />
        </div>
      )}
      <p className="text-[10px] text-slate-500 leading-relaxed">{textoDeLaPorcion(porcion)}</p>
    </div>
  );
}
