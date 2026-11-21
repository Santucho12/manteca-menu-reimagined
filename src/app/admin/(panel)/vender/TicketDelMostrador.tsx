import { Minus, Plus, Scale, Tag, Trash2 } from 'lucide-react';
import { formatearPesos } from '@/lib/plata';
import type { Cuenta, Variada } from '@/lib/vender/cuenta';
import { claveDe, cuentaDeTicket, type RenglonDelTicket } from '@/lib/vender/ticket';
import { PrecioAMano } from './PrecioAMano';

const BOTON_DE_CANTIDAD =
  'size-10 shrink-0 rounded-xl border border-border bg-white flex items-center justify-center hover:bg-secondary active:scale-95 transition-all';

type Acciones = {
  cambiar: (clave: string, cambio: 1 | -1) => void;
  sacar: (clave: string) => void;
  /** Abre la balanza para cambiar lo que se pesó. */
  repesar: (renglon: RenglonDelTicket) => void;
  /** El precio a mano de un renglón (pedido 102). */
  cambiarPrecio?: (clave: string, centavos: number | undefined) => void;
};
type PropsDelRenglon = Acciones & { renglon: RenglonDelTicket; enLaVariada: boolean };

// Lo pesado se toca para cambiar el peso; lo demás, con − y +.
function Cantidad({ renglon, cambiar, repesar }: Omit<PropsDelRenglon, 'sacar' | 'enLaVariada'>) {
  const clave = claveDe(renglon);
  const nombre = `${renglon.nombre} · ${renglon.presentacion}`;
  if (renglon.gramos) {
    return (
      <button
        type="button"
        onClick={() => repesar(renglon)}
        className="flex min-h-10 items-center gap-1.5 rounded-xl bg-amber-50 px-3 text-sm font-bold text-amber-800 hover:bg-amber-100"
      >
        <Scale size={14} aria-hidden="true" /> {renglon.gramos} g · cambiar
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        aria-label={`Uno menos de ${nombre}`}
        onClick={() => cambiar(clave, -1)}
        className={BOTON_DE_CANTIDAD}
      >
        <Minus size={16} aria-hidden="true" />
      </button>
      <span className="w-8 text-center text-sm font-bold tabular-nums">{renglon.cantidad}</span>
      <button
        type="button"
        aria-label={`Uno más de ${nombre}`}
        onClick={() => cambiar(clave, 1)}
        className={BOTON_DE_CANTIDAD}
      >
        <Plus size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

// Arriba el nombre y lo que sale; abajo la cantidad y sacar. Lo que entra en la docena variada no
// muestra precio suelto: se cobra en el recuadro de abajo.
function Renglon({ renglon, enLaVariada, sacar, cambiarPrecio, ...acciones }: PropsDelRenglon) {
  const nombre = `${renglon.nombre} · ${renglon.presentacion}`;
  return (
    <li className="space-y-2 px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 text-sm font-semibold wrap-break-word">{nombre}</p>
        {enLaVariada ? (
          <span className="shrink-0 text-xs font-semibold text-emerald-700">por cantidad</span>
        ) : (
          <span className="shrink-0 text-sm font-bold tabular-nums">
            {formatearPesos(cuentaDeTicket([renglon], {}).totalCentavos)}
          </span>
        )}
      </div>
      {cambiarPrecio && !renglon.surtida ? (
        <PrecioAMano
          renglon={renglon}
          cambiar={(centavos) => cambiarPrecio(claveDe(renglon), centavos)}
        />
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <Cantidad renglon={renglon} {...acciones} />
        <button
          type="button"
          aria-label={`Sacar ${nombre}`}
          onClick={() => sacar(claveDe(renglon))}
          className="rounded-xl p-2.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
        >
          <Trash2 size={18} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

// Cómo se cobran las sueltas que se juntaron: una línea por forma, el total y lo que se ahorra.
function Variadas({ variadas }: { variadas: Variada[] }) {
  return variadas.map((v) => (
    <div
      key={v.categoriaId}
      className="space-y-2 border-t border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900"
    >
      <p className="flex items-center gap-2 text-sm font-bold">
        <Tag size={15} aria-hidden="true" className="text-emerald-600" />
        Precio por cantidad · {v.unidades} unidades
      </p>
      <ul className="space-y-1 text-sm">
        {v.paquetes.map((p) => (
          <li key={p.nombre} className="flex justify-between gap-3 tabular-nums">
            <span>
              {p.veces} × {p.nombre}
            </span>
            <span className="font-semibold">{formatearPesos(p.subtotalCentavos)}</span>
          </li>
        ))}
      </ul>
      <p className="flex justify-between gap-3 border-t border-emerald-200 pt-2 text-sm font-bold tabular-nums">
        <span>Ahorrás {formatearPesos(v.antesCentavos - v.ahoraCentavos)}</span>
        <span>{formatearPesos(v.ahoraCentavos)}</span>
      </p>
    </div>
  ));
}

const entraEnLaVariada = (r: RenglonDelTicket, categorias: Set<string>) =>
  categorias.has(r.categoriaId ?? '') && !!r.unidades && !!r.compartido && !r.gramos;

type Props = Acciones & { ticket: RenglonDelTicket[]; cuenta: Cuenta };

/** Lo que lleva el cliente, con la docena variada y el total. */
export function TicketDelMostrador({ ticket, cuenta, ...acciones }: Props) {
  if (ticket.length === 0) {
    return (
      <p className="rounded-2xl border-2 border-dashed border-border p-8 text-center text-sm font-medium text-muted-foreground">
        Tocá un producto para sumarlo.
      </p>
    );
  }
  const categorias = new Set(cuenta.variadas.map((v) => v.categoriaId));
  return (
    <section
      aria-label="Ticket"
      className="overflow-hidden rounded-2xl border border-border bg-white"
    >
      <ul aria-label="Ticket" className="divide-y divide-border">
        {ticket.map((r) => (
          <Renglon
            key={claveDe(r)}
            renglon={r}
            enLaVariada={entraEnLaVariada(r, categorias)}
            {...acciones}
          />
        ))}
      </ul>
      <Variadas variadas={cuenta.variadas} />
    </section>
  );
}
