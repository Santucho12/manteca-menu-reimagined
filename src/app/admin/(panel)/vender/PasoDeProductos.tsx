import type { CategoriaParaVender } from '@/lib/vender/catalogo';
import type { ItemDelCatalogo } from '@/lib/vender/ticket';
import type { usePasos } from '@/lib/vender/usePasos';
import type { useTicket } from '@/lib/vender/useMostrador';
import { Balanza } from './Balanza';
import { CatalogoDelMostrador } from './CatalogoDelMostrador';
import { TicketDelMostrador } from './TicketDelMostrador';

type Props = {
  catalogo: CategoriaParaVender[];
  ticket: ReturnType<typeof useTicket>;
  pasos: ReturnType<typeof usePasos>;
};

/** El primer paso: los productos a la izquierda y, al lado, la balanza si se pesa algo y el ticket. */
export function PasoDeProductos({ catalogo, ticket, pasos }: Props) {
  const { pesando } = pasos;
  const elegir = (forma: ItemDelCatalogo) =>
    forma.gramosDeLaForma ? pasos.pesar(forma, ticket.ticket) : ticket.sumar(forma);
  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_minmax(320px,400px)]">
      <CatalogoDelMostrador catalogo={catalogo} ticket={ticket.ticket} elegir={elegir} />
      <div className="space-y-4 lg:sticky lg:top-6">
        {pesando ? (
          <Balanza
            key={`${pesando.forma.productoId}|${pesando.forma.presentacionId}`}
            forma={pesando.forma}
            inicial={pesando.gramos}
            cerrar={pasos.dejarDePesar}
            pesar={(gramos) => {
              ticket.pesar(pesando.forma, gramos);
              pasos.dejarDePesar();
            }}
          />
        ) : null}
        <TicketDelMostrador
          ticket={ticket.ticket}
          cuenta={ticket.cuenta}
          cambiar={ticket.cambiar}
          sacar={ticket.sacar}
          repesar={(renglon) => pasos.pesar(renglon, ticket.ticket)}
          cambiarPrecio={ticket.cambiarPrecio}
        />
      </div>
    </div>
  );
}
