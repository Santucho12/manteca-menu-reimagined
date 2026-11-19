'use client';

import { toast } from 'sonner';
import { formatearPesos } from '@/lib/plata';
import type { CategoriaParaVender } from '@/lib/vender/catalogo';
import { estadoDelCobro } from '@/lib/vender/cobro';
import { ventaDelTicket } from '@/lib/vender/esquemas';
import { useCobrar, useEleccion, useTicket } from '@/lib/vender/useMostrador';
import { venderDesdeElMostrador } from './acciones';
import { CatalogoDelMostrador } from './CatalogoDelMostrador';
import { CobroDelMostrador } from './CobroDelMostrador';
import { TicketDelMostrador } from './TicketDelMostrador';

/** El mostrador: los productos a la izquierda y, al lado, el ticket y el cobro. */
export function Mostrador({ catalogo }: { catalogo: CategoriaParaVender[] }) {
  const ticket = useTicket(catalogo);
  const eleccion = useEleccion();
  const cobro = estadoDelCobro(ticket.totalCentavos, eleccion.eleccion, eleccion.pagaCon);
  const cobrar = useCobrar(venderDesdeElMostrador, (venta) => {
    const vuelto = cobro.vuelto ? { description: cobro.vuelto } : undefined;
    toast.success(`Venta guardada: ${formatearPesos(venta.totalCentavos)}`, vuelto);
    ticket.vaciar();
    eleccion.reiniciar();
  });
  if (catalogo.length === 0) {
    return (
      <p className="p-12 text-center text-sm text-muted-foreground font-medium">
        Todavía no hay productos con precio en el menú.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(320px,400px)] gap-5 md:gap-8 items-start">
      <CatalogoDelMostrador catalogo={catalogo} sumar={ticket.sumar} />
      <div className="space-y-5 lg:sticky lg:top-6">
        <TicketDelMostrador
          ticket={ticket.ticket}
          totalCentavos={ticket.totalCentavos}
          cambiar={ticket.cambiar}
          sacar={ticket.sacar}
        />
        <CobroDelMostrador
          totalCentavos={ticket.totalCentavos}
          eleccion={eleccion}
          cobro={cobro}
          enviando={cobrar.enviando}
          mensaje={cobrar.mensaje}
          cobrar={() => cobro.pagos && cobrar.enviar(ventaDelTicket(ticket.ticket, cobro.pagos))}
        />
      </div>
    </div>
  );
}
