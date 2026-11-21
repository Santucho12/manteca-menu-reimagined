'use client';

import {
  Calculator,
  ChevronRight,
  CircleDollarSign,
  Receipt,
  ShoppingBag,
  Trash2,
  TriangleAlert,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { Aviso } from '@/lib/inicio/avisos';
import { colorDelAviso } from '@/lib/inicio/colorDelAviso';

const ICONOS: Record<string, LucideIcon> = {
  caja: CircleDollarSign,
  gastos: Receipt,
  ventas: ShoppingBag,
  usuarios: Users,
  costos: Calculator,
};

// El ícono de la sección del aviso, en su cuadrado de color (Santiago, 2026-11-21).
function IconoDelAviso({ enlace }: { enlace: string }) {
  const color = colorDelAviso(enlace);
  const Icono = ICONOS[color.nombre] ?? TriangleAlert;
  return (
    <span
      aria-hidden="true"
      className={`grid size-8 shrink-0 place-items-center rounded-lg border ${color.fondo} ${color.texto} ${color.borde}`}
    >
      <Icono size={15} />
    </span>
  );
}

type Props = { aviso: Aviso; descartar: (aviso: Aviso) => void };

// Antes de sacar el aviso pregunta si está seguro, en la misma fila (Santiago, 2026-11-20).
function Confirmar({ si, no }: { si: () => void; no: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm">
      <span className="font-bold text-rose-800">
        ¿Seguro que querés eliminar este aviso por hoy?
      </span>
      <span className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={no}
          className="h-8 rounded-lg px-3 text-xs font-bold text-muted-foreground hover:bg-white"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={si}
          className="h-8 rounded-lg bg-rose-600 px-3 text-xs font-bold text-white hover:bg-rose-700"
        >
          Eliminar
        </button>
      </span>
    </div>
  );
}

/** Un aviso que lleva a donde se resuelve; el tacho lo saca por hoy, después de confirmar. */
export function FilaDeAviso({ aviso, descartar }: Props) {
  const [confirmando, setConfirmando] = useState(false);
  if (confirmando) {
    return (
      <li>
        <Confirmar si={() => descartar(aviso)} no={() => setConfirmando(false)} />
      </li>
    );
  }
  return (
    <li className="relative">
      <Link
        href={aviso.enlace}
        className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-white/60 py-3 pl-3 pr-12 text-sm font-bold hover:bg-white hover:border-slate-300 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
      >
        <IconoDelAviso enlace={aviso.enlace} />
        <span className="min-w-0 flex-1">{aviso.texto}</span>
        <span className="shrink-0 h-6 w-6 rounded-full bg-secondary text-muted-foreground flex items-center justify-center transition-all duration-200 group-hover:bg-rose-600 group-hover:text-white">
          <ChevronRight size={13} aria-hidden="true" />
        </span>
      </Link>
      <button
        type="button"
        aria-label={`Eliminar el aviso: ${aviso.texto}`}
        title="Eliminar por hoy"
        onClick={() => setConfirmando(true)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
      >
        <Trash2 size={15} aria-hidden="true" />
      </button>
    </li>
  );
}
