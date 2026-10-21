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
      <p className="text-[11px] font-bold tracking-[0.18em] uppercase opacity-60">{etiqueta}</p>
      <p className="text-lg font-bold whitespace-nowrap">{valor}</p>
    </div>
  );
}

export function BloqueDelMes({
  resultado,
  cantidad,
}: {
  resultado: ResultadoDelPeriodo;
  cantidad: number;
}) {
  const porcion = porcionDelResultado(resultado);
  const final = resultado.resultadoCentavos;
  return (
    <section
      aria-label="Ventas del mes"
      className="bg-foreground text-background flex flex-col gap-6 rounded-3xl p-6 md:p-8 lg:flex-row lg:items-center lg:justify-between"
    >
      <div className="min-w-0">
        <p className="text-background/70 text-xs font-bold tracking-[0.25em] uppercase">
          Ventas del mes
        </p>
        <p className="mt-2 opacity-75">{textoDeVentasDelMes(cantidad)}</p>
        <p className="mt-2 text-4xl font-bold tracking-tight break-words md:text-6xl">
          {formatearPesos(resultado.ventasCentavos)}
        </p>
      </div>
      <div className="border-background/15 bg-background/5 space-y-4 rounded-2xl border p-5 lg:w-96">
        <div className="grid grid-cols-2 gap-4">
          <Dato etiqueta="Gastos" valor={formatearPesos(resultado.gastosCentavos)} />
          <Dato
            etiqueta="Resultado"
            valor={final === null ? 'Sin calcular' : formatearPesos(final)}
          />
        </div>
        {porcion === null ? null : (
          <div className="bg-background/15 h-1.5 overflow-hidden rounded-full">
            <div className="h-full rounded-full bg-green-500" style={{ width: `${porcion}%` }} />
          </div>
        )}
        <p className="text-xs opacity-60">{textoDeLaPorcion(porcion)}</p>
      </div>
    </section>
  );
}
