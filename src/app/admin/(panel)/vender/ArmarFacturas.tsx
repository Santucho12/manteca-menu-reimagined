'use client';

import { Check, Minus } from 'lucide-react';
import { useState } from 'react';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { useGuardar } from '@/lib/gastos/useGuardar';
import { cn } from '@/lib/utils';
import { tonoEnLista } from '@/lib/vender/colores';
import type { PorArmar } from '@/lib/vender/consultas';
import { armadoCompleto, detalleDelArmado, faltanParaArmar } from '@/lib/vender/surtidas';
import { armarDesdeElMostrador } from './acciones';

type Props = {
  pendiente: PorArmar;
  productos: { id: string; nombre: string }[];
  alTerminar: () => void;
  /** Cierra sin armar: queda en Por armar, arriba en Vender. */
  despues?: () => void;
};

/** Se toca cada factura que entra en la bolsa; al completar lo cobrado, se guarda sola (pedido 102). */
export function ArmarFacturas({ pendiente, productos, alTerminar, despues }: Props) {
  const [elegidas, setElegidas] = useState<Record<string, number>>({});
  const guardado = useGuardar(armarDesdeElMostrador, alTerminar);
  const faltan = faltanParaArmar(pendiente.unidades, elegidas);
  const sumar = (id: string, cambio: 1 | -1) => {
    const nuevas = { ...elegidas, [id]: Math.max(0, (elegidas[id] ?? 0) + cambio) };
    if (faltanParaArmar(pendiente.unidades, nuevas) < 0) return;
    setElegidas(nuevas);
    if (armadoCompleto(pendiente.unidades, nuevas))
      guardado.enviar({ renglonId: pendiente.renglonId, detalle: detalleDelArmado(nuevas) });
  };
  return (
    <section aria-label="Armá las facturas" className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-base font-bold">Armá las facturas</p>
        <p
          className={cn(
            'text-sm font-bold tabular-nums',
            faltan ? 'text-amber-700' : 'text-emerald-700',
          )}
        >
          {faltan
            ? `${pendiente.descripcion} · faltan ${faltan}`
            : guardado.enviando
              ? 'Guardando…'
              : 'Listo'}
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-2">
        {productos.map((p, i) => {
          const cuantas = elegidas[p.id] ?? 0;
          const tono = tonoEnLista(i);
          return (
            <li key={p.id} className="flex items-stretch gap-1">
              <button
                type="button"
                disabled={faltan === 0}
                onClick={() => sumar(p.id, 1)}
                className={cn(
                  'flex min-h-14 flex-1 items-center justify-between gap-2 rounded-2xl px-3 text-left text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-60',
                  cuantas ? `${tono.solido} text-white` : `${tono.suave} ${tono.texto}`,
                )}
              >
                <span className="min-w-0 wrap-break-word">{p.nombre}</span>
                {cuantas ? <span className="tabular-nums">×{cuantas}</span> : null}
              </button>
              {cuantas ? (
                <button
                  type="button"
                  aria-label={`Una menos de ${p.nombre}`}
                  onClick={() => sumar(p.id, -1)}
                  className="flex w-11 items-center justify-center rounded-2xl bg-secondary"
                >
                  <Minus size={16} aria-hidden="true" />
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
      {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
      {despues && faltan > 0 ? (
        <button
          type="button"
          onClick={despues}
          className="min-h-11 rounded-xl px-3 text-sm font-bold text-muted-foreground hover:bg-secondary"
        >
          Armar después
        </button>
      ) : null}
      {faltan === 0 && !guardado.mensaje ? (
        <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
          <Check size={16} aria-hidden="true" /> Quedó armado con lo que se llevó.
        </p>
      ) : null}
    </section>
  );
}
