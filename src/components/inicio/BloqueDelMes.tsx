import { Sparkles } from 'lucide-react';
import {
  porcionDelResultado,
  textoDeLaPorcion,
  textoDeVentasDelMes,
} from '@/lib/inicio/bloqueDelMes';
import { formatearPesos } from '@/lib/plata';
import type { ResultadoDelPeriodo } from '@/lib/reportes/resultado';

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold tracking-[0.18em] text-white/75 uppercase">{etiqueta}</p>
      <p className="font-heading text-xl font-bold whitespace-nowrap">{valor}</p>
    </div>
  );
}

type Props = { resultado: ResultadoDelPeriodo; cantidad: number; className?: string };

export function BloqueDelMes({ resultado, cantidad, className = '' }: Props) {
  const porcion = porcionDelResultado(resultado);
  const final = resultado.resultadoCentavos;
  return (
    <section
      aria-label="Ventas del mes"
      className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 p-7 text-white shadow-xl shadow-indigo-500/25 md:p-9 ${className}`}
    >
      <div className="absolute -top-24 -right-16 size-72 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-28 left-1/3 size-64 rounded-full bg-violet-300/20 blur-3xl" />
      <div className="relative flex flex-col gap-8">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold tracking-[0.2em] uppercase">
            <Sparkles size={14} aria-hidden="true" />
            Ventas del mes
          </p>
          <p className="mt-4 font-medium text-white/80">{textoDeVentasDelMes(cantidad)}</p>
          <p className="font-heading mt-1 text-4xl font-extrabold tracking-tighter break-words md:text-6xl">
            {formatearPesos(resultado.ventasCentavos)}
          </p>
        </div>
        <div className="space-y-4 rounded-2xl bg-white/15 p-5 backdrop-blur">
          <div className="grid grid-cols-2 gap-4">
            <Dato etiqueta="Gastos" valor={formatearPesos(resultado.gastosCentavos)} />
            <Dato
              etiqueta="Balance"
              valor={final === null ? 'Sin calcular' : formatearPesos(final)}
            />
          </div>
          {porcion === null ? null : (
            <div className="h-2 overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-emerald-300"
                style={{ width: `${porcion}%` }}
              />
            </div>
          )}
          <p className="text-xs font-medium text-white/85">{textoDeLaPorcion(porcion)}</p>
        </div>
      </div>
    </section>
  );
}
