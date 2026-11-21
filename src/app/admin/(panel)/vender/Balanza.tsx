'use client';

import { Minus, Plus, Scale, X } from 'lucide-react';
import { useState } from 'react';
import { formatearPesos } from '@/lib/plata';
import { cn } from '@/lib/utils';
import { subtotalSolo } from '@/lib/vender/cuenta';
import type { ItemDelCatalogo } from '@/lib/vender/ticket';

const ATAJOS = [100, 250, 500, 1000];
const PASO = 50;
const ENTRE = (g: number) => Math.min(99999, Math.max(1, g));

type Control = { gramos: number; setGramos: (cambio: number | ((g: number) => number)) => void };

/** El peso: con − y + de a 50 g, escrito a mano o con un atajo. */
function ControlDePeso({ gramos, setGramos }: Control) {
  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Menos peso"
          onClick={() => setGramos((g) => ENTRE(g - PASO))}
          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300 bg-white active:scale-95"
        >
          <Minus size={20} aria-hidden="true" />
        </button>
        <label className="flex h-14 flex-1 items-center justify-center gap-1 rounded-2xl border-2 border-foreground bg-white font-display text-2xl font-bold">
          <span className="sr-only">Gramos</span>
          <input
            inputMode="numeric"
            value={gramos}
            onChange={(e) => setGramos(ENTRE(Number(e.target.value.replace(/\D/g, '')) || 1))}
            className="w-24 bg-transparent text-right tabular-nums outline-none"
          />
          <span>g</span>
        </label>
        <button
          type="button"
          aria-label="Más peso"
          onClick={() => setGramos((g) => ENTRE(g + PASO))}
          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300 bg-white active:scale-95"
        >
          <Plus size={20} aria-hidden="true" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {ATAJOS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGramos(g)}
            className={cn(
              'min-h-11 rounded-xl border px-3 text-sm font-bold',
              gramos === g
                ? 'border-amber-500 bg-amber-500 text-white'
                : 'border-amber-300 bg-white text-amber-900',
            )}
          >
            {g >= 1000 ? `${g / 1000} kg` : `${g} g`}
          </button>
        ))}
      </div>
    </>
  );
}

type Props = {
  forma: ItemDelCatalogo;
  inicial: number;
  pesar: (gramos: number) => void;
  cerrar: () => void;
};

/** Lo que va por peso: viene sugerido el peso de la forma, se cambia y el precio sale de la cuenta. */
export function Balanza({ forma, inicial, pesar, cerrar }: Props) {
  const [gramos, setGramos] = useState(inicial);
  const deLaForma = forma.gramosDeLaForma ?? 250;
  const precio = subtotalSolo({
    clave: '',
    categoriaId: '',
    cantidad: 1,
    precioCentavos: forma.precioCentavos,
    unidades: null,
    gramos,
    gramosDeLaForma: deLaForma,
    compartido: false,
  });
  return (
    <section
      aria-label={`Pesar ${forma.nombre}`}
      className="space-y-4 rounded-3xl border-2 border-amber-300 bg-amber-50 p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-white">
            <Scale size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="text-base font-bold">{forma.nombre}</p>
            <p className="text-xs font-semibold text-amber-800">
              {formatearPesos(forma.precioCentavos)} los {deLaForma} g
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Cerrar la balanza"
          onClick={cerrar}
          className="rounded-full p-2 text-amber-800 hover:bg-amber-100"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <ControlDePeso gramos={gramos} setGramos={setGramos} />
      <button
        type="button"
        onClick={() => pesar(gramos)}
        className="flex w-full min-h-14 items-center justify-between rounded-2xl bg-foreground px-5 text-base font-bold text-white active:scale-[0.98]"
      >
        <span>Sumar {gramos} g</span>
        <span className="tabular-nums">{formatearPesos(precio)}</span>
      </button>
    </section>
  );
}
