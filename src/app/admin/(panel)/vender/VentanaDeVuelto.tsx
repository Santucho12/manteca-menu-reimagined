'use client';

import { Calculator, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { formatearPesos } from '@/lib/plata';
import { vueltoParaMostrar, type Vuelto } from '@/lib/vender/vuelto';

// Si nadie la toca, se va sola: en el mostrador no hay tiempo para cerrar ventanas.
const SE_VA_EN = 5000;

/** El vuelto grande, o cuánto falta si no alcanza. */
function Resultado({ vuelto }: { vuelto: NonNullable<Vuelto> }) {
  return (
    <p
      aria-live="polite"
      className={
        'vueltoCentavos' in vuelto
          ? 'flex items-baseline justify-between rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-800'
          : 'rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800'
      }
    >
      {'vueltoCentavos' in vuelto ? (
        <>
          <span className="text-sm font-bold">Vuelto</span>
          <span className="font-display text-3xl font-extrabold tabular-nums">
            {formatearPesos(vuelto.vueltoCentavos)}
          </span>
        </>
      ) : (
        `Faltan ${formatearPesos(vuelto.faltaCentavos)}`
      )}
    </p>
  );
}

/** Lo cobrado en efectivo, cuánto pagaron y el vuelto. */
function SeccionDeVuelto({
  efectivoCentavos,
  tocar,
}: {
  efectivoCentavos: number;
  tocar: () => void;
}) {
  const [pagaron, setPagaron] = useState('');
  const vuelto = vueltoParaMostrar(efectivoCentavos, pagaron);
  return (
    <>
      <p className="text-sm text-muted-foreground">
        En efectivo: <strong className="text-foreground">{formatearPesos(efectivoCentavos)}</strong>
      </p>
      <label className="block space-y-1.5">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          ¿Cuánto te pagaron?
        </span>
        <input
          inputMode="decimal"
          placeholder="Ej: 20.000"
          value={pagaron}
          onFocus={tocar}
          onChange={(e) => setPagaron(e.target.value)}
          className="h-14 w-full rounded-2xl border-2 border-border px-4 font-display text-2xl font-bold tabular-nums outline-none focus:border-emerald-500"
        />
      </label>
      {vuelto ? <Resultado vuelto={vuelto} /> : null}
    </>
  );
}

type Props = {
  efectivoCentavos: number | null;
  cerrar: () => void;
  /** Las facturas surtidas para armar (pedido 102): con eso la ventana no se va sola. */
  armar?: ReactNode;
  esperar?: boolean;
};

/** Aparece al cobrar: el vuelto si fue en efectivo y, si hay surtidas, el armado de las facturas. */
export function VentanaDeVuelto({ efectivoCentavos, cerrar, armar, esperar = false }: Props) {
  const [tocada, setTocada] = useState(false);
  const quieta = tocada || esperar;
  useEffect(() => {
    if (quieta) return;
    const reloj = setTimeout(cerrar, SE_VA_EN);
    return () => clearTimeout(reloj);
  }, [quieta, cerrar]);
  return (
    <div className="fixed inset-x-0 bottom-6 z-[150] flex justify-center px-4">
      <section
        role="dialog"
        aria-label={efectivoCentavos ? 'Calcular vuelto' : 'Armá las facturas'}
        onPointerDown={() => setTocada(true)}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-emerald-200 bg-white shadow-2xl"
      >
        {quieta ? null : (
          <div aria-hidden="true" className="h-1.5 bg-emerald-100">
            <div className="h-full origin-left animate-[achicar_5s_linear_forwards] bg-emerald-500" />
          </div>
        )}
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-base font-bold">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white">
                <Calculator size={18} aria-hidden="true" />
              </span>
              {efectivoCentavos ? 'Calcular vuelto' : 'Venta cobrada'}
            </p>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={cerrar}
              className="rounded-full p-2 text-muted-foreground hover:bg-secondary"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          {efectivoCentavos ? (
            <SeccionDeVuelto efectivoCentavos={efectivoCentavos} tocar={() => setTocada(true)} />
          ) : null}
          {armar}
        </div>
      </section>
    </div>
  );
}
