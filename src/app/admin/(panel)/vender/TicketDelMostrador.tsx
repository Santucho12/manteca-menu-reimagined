import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatearPesos } from '@/lib/plata';
import { claveDe, subtotalDe, type RenglonDelTicket } from '@/lib/vender/ticket';

const BOTON_DE_CANTIDAD =
  'size-9 pointer-coarse:size-11 shrink-0 rounded-xl border border-border bg-card flex items-center justify-center hover:border-primary/40 active:scale-95 transition-all';

type Acciones = {
  cambiar: (clave: string, cambio: 1 | -1) => void;
  sacar: (clave: string) => void;
};

function Renglon({ renglon, cambiar, sacar }: Acciones & { renglon: RenglonDelTicket }) {
  const clave = claveDe(renglon);
  const nombre = `${renglon.nombre} · ${renglon.presentacion}`;
  return (
    <li className="px-4 md:px-5 py-3 flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-[8rem]">
        <p className="text-sm font-semibold wrap-break-word">{nombre}</p>
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {renglon.cantidad} × {formatearPesos(renglon.precioCentavos)}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label={`Uno menos de ${nombre}`}
          onClick={() => cambiar(clave, -1)}
          className={BOTON_DE_CANTIDAD}
        >
          <Minus size={16} aria-hidden="true" />
        </button>
        <span className="w-7 text-center text-sm font-bold tabular-nums">{renglon.cantidad}</span>
        <button
          type="button"
          aria-label={`Uno más de ${nombre}`}
          onClick={() => cambiar(clave, 1)}
          className={BOTON_DE_CANTIDAD}
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
      <span className="text-sm font-bold tabular-nums">{formatearPesos(subtotalDe(renglon))}</span>
      <button
        type="button"
        aria-label={`Sacar ${nombre}`}
        onClick={() => sacar(clave)}
        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </li>
  );
}

type Props = Acciones & { ticket: RenglonDelTicket[]; totalCentavos: number };

/** Lo que lleva el cliente, con el total arriba. */
export function TicketDelMostrador({ ticket, totalCentavos, cambiar, sacar }: Props) {
  return (
    <section
      aria-labelledby="titulo-del-ticket"
      className="bg-card rounded-3xl md:rounded-[2rem] border border-border/60 shadow-xl overflow-hidden"
    >
      <div className="px-4 md:px-6 py-4 border-b border-border bg-secondary/20 flex items-center justify-between gap-3">
        <h2
          id="titulo-del-ticket"
          className="text-sm md:text-base font-bold tracking-tight uppercase text-muted-foreground/80"
        >
          Ticket
        </h2>
        <span className="font-display text-xl font-bold tabular-nums">
          {formatearPesos(totalCentavos)}
        </span>
      </div>
      {ticket.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground font-medium">
          Tocá un producto para sumarlo.
        </p>
      ) : (
        <ul aria-label="Ticket" className="divide-y divide-border">
          {ticket.map((r) => (
            <Renglon key={claveDe(r)} renglon={r} cambiar={cambiar} sacar={sacar} />
          ))}
        </ul>
      )}
    </section>
  );
}
