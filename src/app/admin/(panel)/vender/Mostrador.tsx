'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { formatearPesos } from '@/lib/plata';
import { destinoAlCobrar } from '@/lib/ventas/edicion';
import type { CategoriaParaVender } from '@/lib/vender/catalogo';
import type { TipoParaVender } from '@/lib/vender/consultas';
import { estadoDelCobro } from '@/lib/vender/cobro';
import { ventaDelTicket } from '@/lib/vender/esquemas';
import { descuentoEnCentavos } from '@/lib/vender/descuento';
import {
  useCobrar,
  useDescuento,
  useEleccion,
  useMotivoDelPrecio,
  useTicket,
} from '@/lib/vender/useMostrador';
import { usePasos } from '@/lib/vender/usePasos';
import { venderDesdeElMostrador } from './acciones';
import { BarraDePasos } from './BarraDePasos';
import { CobroDelMostrador } from './CobroDelMostrador';
import { Descuento } from './Descuento';
import { ElegirTipo } from './ElegirTipo';
import { MotivoDelPrecio } from './MotivoDelPrecio';
import { PasoDeProductos } from './PasoDeProductos';
import { PieDelPaso } from './PieDelPaso';

type Props = { catalogo: CategoriaParaVender[]; tipos: TipoParaVender[] };

const productos = (n: number) => `${n} ${n === 1 ? 'producto' : 'productos'}`;

// Sin internet la venta queda en el equipo: se avisa y no se va a Ventas, que no cargaría.
function avisarSinConexion(venta: { sinConexion?: boolean }) {
  if (!venta.sinConexion) return false;
  toast.warning(
    'Sin conexión: la venta quedó en este equipo y se manda sola cuando vuelva internet.',
  );
  return true;
}

/** El mostrador en tres pasos: qué lleva, dónde se vendió y cómo paga (pedido 102). */
export function Mostrador({ catalogo = [], tipos = [] }: Props) {
  const pasos = usePasos(tipos);
  const ticket = useTicket(catalogo);
  const eleccion = useEleccion();
  const descuento = useDescuento();
  const descontado = descuentoEnCentavos(ticket.totalCentavos, descuento.elegido);
  const total = ticket.totalCentavos - descontado;
  const cobro = estadoDelCobro(total, eleccion.eleccion, eleccion.pagaCon);
  const router = useRouter();
  // Si hay un precio a mano, el cobro pide el motivo (pedido 102).
  const precio = useMotivoDelPrecio(ticket.ticket);
  const cobrar = useCobrar(venderDesdeElMostrador, (venta) => {
    ticket.vaciar();
    eleccion.reiniciar();
    descuento.reiniciar();
    precio.setMotivo('');
    pasos.reiniciar();
    if (avisarSinConexion(venta)) return;
    toast.success(`Venta guardada: ${formatearPesos(venta.totalCentavos)}`);
    // Al cobrar lleva a Ventas; con efectivo, allá se abre la ventana de vuelto (pedido 102).
    const efectivo = cobro.pagos?.find((p) => p.medio === 'efectivo')?.montoCentavos ?? null;
    const surtidas = ticket.ticket.some((r) => r.surtida);
    router.push(destinoAlCobrar(efectivo, surtidas ? venta.id : null));
  });
  if (catalogo.length === 0) {
    return (
      <p className="p-12 text-center text-sm font-medium text-muted-foreground">
        Todavía no hay productos con precio en el menú.
      </p>
    );
  }
  const tipoParaGuardar = pasos.tipo === pasos.local ? null : pasos.tipo;
  return (
    <div className="space-y-6">
      <BarraDePasos paso={pasos.paso} irA={pasos.irA} />
      {pasos.paso === 0 ? (
        <PasoDeProductos catalogo={catalogo} ticket={ticket} pasos={pasos} />
      ) : null}
      {pasos.paso === 1 ? (
        <ElegirTipo tipos={tipos} elegido={pasos.tipo} elegir={pasos.setTipo} />
      ) : null}
      {pasos.paso === 2 ? (
        <CobroDelMostrador
          totalCentavos={total}
          eleccion={eleccion}
          cobro={cobro}
          enviando={cobrar.enviando}
          mensaje={cobrar.mensaje}
          descuento={<Descuento {...descuento} descuentoCentavos={descontado} />}
          antesDelBoton={
            precio.aMano ? (
              <MotivoDelPrecio valor={precio.motivo} cambiar={precio.setMotivo} />
            ) : null
          }
          listo={precio.listo}
          resumen={`${productos(ticket.ticket.length)} · ${pasos.nombreDelTipo}`}
          cobrar={() =>
            cobro.pagos &&
            cobrar.enviar({
              ...ventaDelTicket(
                ticket.ticket,
                cobro.pagos,
                tipoParaGuardar,
                descuento.elegido ?? undefined,
              ),
              ...(precio.aMano ? { motivoPrecio: precio.motivo } : {}),
              totalCentavos: total,
            })
          }
        />
      ) : null}
      <PieDelPaso
        paso={pasos.paso}
        totalCentavos={total}
        vacio={ticket.ticket.length === 0}
        irA={pasos.irA}
      />
    </div>
  );
}
