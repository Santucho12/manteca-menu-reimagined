import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Las piezas del frente de Caja, hecho de cero con la skill estetica-sistema (Santiago, 2026-11-21).

const TONOS = {
  neutro: 'bg-slate-50 text-slate-600 border-slate-200',
  bien: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  mal: 'bg-rose-50 text-rose-600 border-rose-200',
  violeta: 'bg-violet-50 text-violet-600 border-violet-200',
  naranja: 'bg-orange-50 text-orange-600 border-orange-200',
} as const;
export type TonoDeCaja = keyof typeof TONOS;

type PropsDeBloque = {
  titulo: string;
  ayuda?: string;
  icono: LucideIcon;
  tono?: TonoDeCaja;
  derecha?: ReactNode;
  children: ReactNode;
};

/** Un bloque del cierre: tarjeta blanca con su ícono de color, el título, la ayuda y sus campos. */
export function Bloque({
  titulo,
  ayuda,
  icono: Icono,
  tono = 'neutro',
  derecha,
  children,
}: PropsDeBloque) {
  return (
    <section
      aria-label={titulo}
      className="space-y-5 rounded-2xl border border-border bg-white p-5 shadow-card md:p-7"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'grid size-10 shrink-0 place-items-center rounded-xl border',
              TONOS[tono],
            )}
          >
            <Icono size={18} aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-base font-extrabold tracking-tight">{titulo}</h2>
            {ayuda ? <p className="text-xs leading-snug text-muted-foreground">{ayuda}</p> : null}
          </div>
        </div>
        {derecha}
      </header>
      {children}
    </section>
  );
}

type PropsDeNumero = { etiqueta: string; valor: string; detalle?: string; tono?: TonoDeCaja };

/** Un número grande con su etiqueta, como las tarjetas de Inicio. */
export function Numero({ etiqueta, valor, detalle, tono = 'neutro' }: PropsDeNumero) {
  return (
    <div className={cn('rounded-xl border bg-white p-4 shadow-card', TONOS[tono].split(' ')[2])}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{etiqueta}</p>
      <p className="font-display text-xl font-bold tracking-tight tabular-nums text-slate-900 sm:text-2xl">
        {valor}
      </p>
      {detalle ? (
        <p className="mt-2 border-t border-slate-100 pt-2 text-[10px] font-bold uppercase text-slate-400">
          {detalle}
        </p>
      ) : null}
    </div>
  );
}

const ESTADOS: Record<string, [string, TonoDeCaja]> = {
  cierra: ['Cierra', 'bien'],
  con_diferencia: ['Con diferencia', 'mal'],
  anulado: ['Anulado', 'neutro'],
  no_abrio: ['No abrió', 'neutro'],
};

/** La píldora del estado de un cierre: verde si cierra, roja si no, gris si se anuló o no abrió. */
export function EstadoDelCierre({ estado, anulado }: { estado: string; anulado?: boolean }) {
  const [texto, tono] = ESTADOS[anulado ? 'anulado' : estado] ?? ESTADOS.con_diferencia!;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider',
        TONOS[tono],
      )}
    >
      {texto}
    </span>
  );
}
