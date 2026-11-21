'use client';

import { CalendarDays, Moon, Sun, UserRound } from 'lucide-react';
import type { ChangeEvent } from 'react';
import type { DatosDeCierre } from '@/lib/caja/esquemas';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import type { Registro } from '@/lib/formularios/valorInicial';
import { cn } from '@/lib/utils';

type Props = {
  registro: Registro<DatosDeCierre>;
  inicial: Pick<DatosDeCierre, 'fecha' | 'turno'>;
  quien?: string;
  /** Editando, la fecha y el turno no cambian: se muestran, no se eligen. */
  fijo: boolean;
  cambiarFecha: (evento: ChangeEvent<HTMLInputElement>) => void;
  cambiarTurno: (turno: '1' | '2') => void;
};

const TURNOS = [
  { valor: '1', texto: 'Mediodía', Icono: Sun },
  { valor: '2', texto: 'Noche', Icono: Moon },
] as const;

const ETIQUETA = 'flex items-center gap-1.5 text-xs font-semibold text-white/70';

function Eleccion({
  registro,
  cambiarFecha,
  cambiarTurno,
}: Omit<Props, 'inicial' | 'quien' | 'fijo'>) {
  const fecha = registro('fecha');
  const turno = registro('turno');
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
      <label className="block space-y-1.5">
        <span className={ETIQUETA}>
          <CalendarDays size={14} aria-hidden="true" /> Fecha
        </span>
        <input
          type="date"
          {...fecha}
          onChange={cambiarFecha}
          className="h-12 w-full rounded-xl border border-white/15 bg-white/10 px-4 font-display text-lg font-bold text-white outline-none [color-scheme:dark] focus:border-white/40 md:w-64"
        />
      </label>
      <fieldset className="flex gap-2" aria-label="Turno">
        {TURNOS.map(({ valor, texto, Icono }) => (
          <label key={valor} className="cursor-pointer">
            <input
              type="radio"
              value={valor}
              {...turno}
              onChange={(e) => {
                void turno.onChange(e);
                cambiarTurno(valor);
              }}
              className="peer sr-only"
            />
            <span
              className={cn(
                'flex h-12 items-center gap-2 rounded-xl border border-white/15 px-5 text-sm font-bold text-white/70 transition-all hover:bg-white/10',
                'peer-checked:border-white peer-checked:bg-white peer-checked:text-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-white/60',
              )}
            >
              <Icono size={16} aria-hidden="true" /> {texto}
            </span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}

/** Arriba, oscuro y grande: qué cierre se está cargando y quién lo carga. */
export function EncabezadoDeLaCarga({ inicial, quien, fijo, ...eleccion }: Props) {
  return (
    <section
      aria-label="Qué cierre se carga"
      className="relative overflow-hidden rounded-3xl bg-foreground p-6 text-white shadow-card md:p-8"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
        Cierre de caja
      </p>
      {fijo ? (
        <p className="mt-3 font-display text-3xl font-extrabold tracking-tight">
          {fechaParaMostrar(inicial.fecha)} · {inicial.turno === '1' ? 'Mediodía' : 'Noche'}
        </p>
      ) : (
        <Eleccion {...eleccion} />
      )}
      {quien ? (
        <p className="mt-5 flex items-center gap-2 text-sm text-white/70">
          <UserRound size={15} aria-hidden="true" /> Lo carga{' '}
          <strong className="text-white">{quien}</strong>
        </p>
      ) : null}
    </section>
  );
}
