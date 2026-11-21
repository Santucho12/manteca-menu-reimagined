import { Ban, Pencil } from 'lucide-react';
import type { ReactNode } from 'react';
import { InsigniaDeEstado } from '@/components/panel/Insignias';
import { fechaYHora } from '@/lib/auditoria/textos';
import { formatearPesos } from '@/lib/plata';
import { cn } from '@/lib/utils';
import type { Venta } from '@/lib/ventas/consultas';
import { estadoDeVenta, tonoDeEstado } from '@/lib/ventas/pantalla';
import { precioPorCantidad, textoDelDescuento } from '@/lib/ventas/porCantidad';
import { cantidadParaMostrar } from '@/lib/ventas/renglones';
import { MediosDePago } from '../OrigenYMedio';

const TARJETA = 'rounded-2xl border border-border bg-white shadow-card';
const ETIQUETA = 'text-[10px] font-bold uppercase tracking-widest text-muted-foreground';

/** Arriba de todo: si se anuló, por qué. Es lo primero que hay que saber de la venta. */
export function AvisoDeAnulada({ venta }: { venta: Venta }) {
  if (!venta.anulado) return null;
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
      <Ban size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-rose-600" />
      <p>
        <strong className="font-bold">Anulada:</strong> {venta.motivo_anulacion}
        <span className="block text-xs text-rose-700/80">
          No cuenta en los totales ni en la caja.
        </span>
      </p>
    </div>
  );
}

/** Lo que cambió el precio de la venta: precio a mano y descuento. */
function AjustesDelTicket({ venta }: { venta: Venta }) {
  return (
    <>
      {venta.motivo_precio ? (
        <p className="border-t border-blue-100 bg-blue-50/60 px-6 py-3 text-sm text-blue-800">
          <span className="font-bold">Precio a mano.</span> Motivo: {venta.motivo_precio}
        </p>
      ) : null}
      {venta.descuento_centavos > 0 ? (
        <div className="flex items-baseline justify-between gap-4 border-t border-rose-100 bg-rose-50/60 px-6 py-4 text-sm text-rose-700">
          <span className="min-w-0">
            <span className="block font-bold">
              {textoDelDescuento(
                venta.descuento_centavos,
                venta.descuento_porcentaje,
                venta.descuento_tipo,
              )}
            </span>
            {venta.motivo_descuento ? (
              <span className="block text-xs">Motivo: {venta.motivo_descuento}</span>
            ) : null}
          </span>
          <span className="font-bold tabular-nums">
            − {formatearPesos(venta.descuento_centavos)}
          </span>
        </div>
      ) : null}
    </>
  );
}

/** Los productos como en un ticket, con el total grande abajo. */
export function TicketDeLaVenta({ venta }: { venta: Venta }) {
  const porCantidad = precioPorCantidad(venta.renglones);
  return (
    <section aria-label="Lo vendido" className={cn(TARJETA, 'flex h-full flex-col')}>
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="font-display text-base font-bold tracking-tight">Productos</h2>
        <span className="text-xs font-semibold text-muted-foreground">
          {venta.renglones.length} {venta.renglones.length === 1 ? 'renglón' : 'renglones'}
        </span>
      </div>
      {venta.renglones.length === 0 ? (
        <p className="flex-1 px-6 py-5 text-sm text-muted-foreground">
          Vino de Fudo sin detalle de productos: solo el total.
        </p>
      ) : (
        <ul aria-label="Productos" className="flex-1 divide-y divide-border px-6">
          {venta.renglones.map((renglon) => (
            <li key={renglon.id} className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="text-sm font-bold break-words">{renglon.descripcion}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {cantidadParaMostrar(renglon.cantidad)} ×{' '}
                  {formatearPesos(renglon.precio_unitario_centavos)}
                  {renglon.precio_cambiado ? (
                    <span className="ml-2 font-semibold text-blue-700">· precio a mano</span>
                  ) : null}
                </p>
              </div>
              {porCantidad.ids.has(renglon.id) ? (
                <span className="text-xs font-semibold text-emerald-700">por cantidad</span>
              ) : (
                <span className="text-sm font-bold whitespace-nowrap tabular-nums">
                  {formatearPesos(renglon.subtotal_centavos)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {porCantidad.ids.size > 0 ? (
        <div className="flex items-baseline justify-between gap-4 border-t border-emerald-200 bg-emerald-50 px-6 py-4 text-sm text-emerald-800">
          <span className="font-semibold">
            Precio por cantidad · ahorró {formatearPesos(porCantidad.ahorroCentavos)}
          </span>
          <span className="font-bold tabular-nums">
            {formatearPesos(porCantidad.cobradoCentavos)}
          </span>
        </div>
      ) : null}
      <AjustesDelTicket venta={venta} />
      <div className="flex items-baseline justify-between rounded-b-2xl border-t border-border bg-secondary/40 px-6 py-5">
        <span className={ETIQUETA}>Total</span>
        <span
          className={cn(
            'font-display text-3xl font-extrabold tabular-nums',
            venta.anulado && 'text-muted-foreground line-through',
          )}
        >
          {formatearPesos(venta.total_centavos)}
        </span>
      </div>
    </section>
  );
}

function Fila({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5 py-3.5 first:pt-0">
      <dt className={ETIQUETA}>{titulo}</dt>
      <dd className="text-sm font-semibold text-foreground">{children}</dd>
    </div>
  );
}

/** Todo lo demás de la venta, en una columna que se lee de arriba abajo. */
export function DatosDeLaVenta({ venta, pie }: { venta: Venta; pie: ReactNode }) {
  const dosMedios = venta.pagos.length > 1;
  return (
    <aside aria-label="Datos de la venta" className={cn(TARJETA, 'space-y-2 p-6')}>
      <dl className="divide-y divide-border">
        <Fila titulo="Estado">
          <span className="flex flex-wrap gap-2">
            <InsigniaDeEstado tono={tonoDeEstado(venta)}>{estadoDeVenta(venta)}</InsigniaDeEstado>
            {venta.editada ? (
              <InsigniaDeEstado tono="ambar" icono={Pencil}>
                Editada
              </InsigniaDeEstado>
            ) : null}
          </span>
        </Fila>
        {venta.editada && venta.fecha_edicion ? (
          <Fila titulo="Se editó">
            <span className="font-normal">
              {fechaYHora(venta.fecha_edicion)}: {venta.motivo_edicion}
            </span>
          </Fila>
        ) : null}
        <Fila titulo="Cobrado con">
          <ul className="space-y-1.5">
            {venta.pagos.map((pago) => (
              <li key={pago.medio} className="flex items-center justify-between gap-3">
                <MediosDePago medios={[pago.medio]} />
                {dosMedios ? (
                  <span className="tabular-nums">{formatearPesos(pago.monto_centavos)}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </Fila>
        <Fila titulo="Tipo de venta">{venta.canal ?? '—'}</Fila>
        <Fila titulo="Caja">
          {venta.en_la_caja ? 'Se cobró en la caja del local' : 'No pasó por la caja del local'}
        </Fila>
        {venta.comentario ? (
          <Fila titulo="Comentario">
            <span className="whitespace-pre-line font-normal">{venta.comentario}</span>
          </Fila>
        ) : null}
      </dl>
      {pie}
    </aside>
  );
}
