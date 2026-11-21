import {
  ArrowLeftRight,
  Banknote,
  CreditCard,
  QrCode,
  Receipt,
  type LucideIcon,
} from 'lucide-react';
import type { Cierre } from '@/lib/caja/consultas';
import { textoDelControl } from '@/lib/caja/controles';
import { nombreDeMedio, textoDeDiferencia } from '@/lib/caja/pantalla';
import type { Medio } from '@/lib/caja/resultado';
import { nombreDelTurno } from '@/lib/caja/turnos';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { formatearPesos } from '@/lib/plata';
import { cn } from '@/lib/utils';
import { Bloque } from '../../Piezas';

const ICONOS: Record<Medio, LucideIcon> = {
  efectivo: Banknote,
  credito: CreditCard,
  debito: CreditCard,
  qr: QrCode,
  transferencia: ArrowLeftRight,
};

const FONDOS = {
  cierra: 'bg-emerald-600',
  con_diferencia: 'bg-rose-600',
  anulado: 'bg-slate-500',
};

/** Arriba, del color del resultado: verde si cierra, rojo si no, gris si se anuló. */
export function ResultadoDelCierre({ cierre }: { cierre: Cierre }) {
  const fondo = FONDOS[cierre.anulado ? 'anulado' : cierre.estado];
  return (
    <section
      aria-label="Resultado"
      className={cn('rounded-3xl p-6 text-white shadow-card md:p-8', fondo)}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
        {fechaParaMostrar(cierre.fecha)} · {nombreDelTurno(cierre.turno)} · {cierre.persona}
      </p>
      <p className="mt-2 font-display text-4xl font-extrabold tracking-tight">
        {cierre.anulado ? 'Anulado' : cierre.estado === 'cierra' ? 'Cierra' : 'Con diferencia'}
      </p>
      {cierre.anulado && cierre.motivoDeAnulacion ? (
        <p className="mt-2 text-sm text-white/85">Motivo: {cierre.motivoDeAnulacion}</p>
      ) : null}
    </section>
  );
}

function FilaDeMedio({ m }: { m: Cierre['medios'][number] }) {
  const Icono = ICONOS[m.medio];
  const color =
    m.diferenciaCentavos === 0 ? 'text-emerald-600' : m.fuera ? 'text-rose-600' : 'text-slate-500';
  return (
    <li className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3">
      <span className="grid size-9 place-items-center rounded-lg border border-violet-100 bg-violet-50 text-violet-600">
        <Icono size={16} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold">{nombreDeMedio(m.medio)}</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          Contado {formatearPesos(m.declaradoCentavos)} · Esperado{' '}
          {formatearPesos(m.esperadoCentavos)}
        </p>
      </div>
      <span className={cn('text-right text-sm font-bold tabular-nums', color)}>
        {textoDeDiferencia(m.diferenciaCentavos)}
      </span>
    </li>
  );
}

/** Cada medio: lo contado contra lo que esperaba el sistema, y la diferencia. */
export function MedioPorMedio({ cierre }: { cierre: Cierre }) {
  return (
    <Bloque
      titulo="Medio por medio"
      ayuda="Lo contado contra lo que dicen las ventas del turno."
      icono={Banknote}
      tono="violeta"
    >
      <ul className="divide-y divide-border">
        {cierre.medios.map((m) => (
          <FilaDeMedio key={m.medio} m={m} />
        ))}
      </ul>
    </Bloque>
  );
}

/** Lo que dice cada tipo de venta controlado contra lo cargado en el sistema. */
export function TiposDelCierre({ cierre }: { cierre: Cierre }) {
  if (cierre.controles.length === 0) return null;
  return (
    <Bloque
      titulo="Tipos de venta"
      ayuda="Lo facturado en cada uno contra lo cargado."
      icono={Receipt}
      tono="naranja"
    >
      <ul className="divide-y divide-border">
        {cierre.controles.map((c) => (
          <li key={c.canalId} className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm font-bold">{c.tipo}</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                Facturado {formatearPesos(c.anotadoCentavos)} · Cargado{' '}
                {formatearPesos(c.cargadoCentavos)}
              </p>
            </div>
            <span
              className={cn('text-sm font-bold', c.fuera ? 'text-rose-600' : 'text-emerald-600')}
            >
              {textoDelControl(c)}
            </span>
          </li>
        ))}
      </ul>
    </Bloque>
  );
}
