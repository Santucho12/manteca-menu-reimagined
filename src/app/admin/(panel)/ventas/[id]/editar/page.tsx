import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FranjaDeAviso } from '@/components/panel/Avisos';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { catalogoParaVender, tiposParaVender } from '@/lib/vender/consultas';
import { ventaPorId } from '@/lib/ventas/consultas';
import { descuentoDeLaVenta, eleccionDeLosPagos, ticketDeLaVenta } from '@/lib/ventas/edicion';
import { EditorDeVenta } from './EditorDeVenta';

export const metadata: Metadata = { title: 'Editar venta' };

// El admin y Caja: a Caja la base le muestra solo las ventas de los últimos 30 minutos (pedido 102).
export default async function EditarVenta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { datos } = await exigirPaginaYLeer('caja', (cliente) =>
    Promise.all([ventaPorId(cliente, id), catalogoParaVender(cliente), tiposParaVender(cliente)]),
  );
  const [venta, catalogo, tipos] = datos;
  if (!venta || venta.anulado || venta.origen === 'fudo') notFound();
  const { ticket, faltan } = ticketDeLaVenta(venta.renglones, catalogo);
  const inicial = {
    ticket,
    tipo: venta.canal_id,
    eleccion: eleccionDeLosPagos(venta.pagos),
    descuento: descuentoDeLaVenta(venta),
  };
  return (
    <Pantalla
      titulo={`Editar la venta del ${fechaParaMostrar(venta.fecha)}`}
      subtitulo="Cambiá lo que haga falta y, al final, escribí el motivo."
      ayuda="ventas"
    >
      {faltan > 0 ? (
        <FranjaDeAviso>
          <p>
            {faltan === 1 ? 'Un producto ya no está' : `${faltan} productos ya no están`} en el menú
            y no se cargaron: si guardás, salen de la venta.
          </p>
        </FranjaDeAviso>
      ) : null}
      <EditorDeVenta id={venta.id} catalogo={catalogo} tipos={tipos} inicial={inicial} />
    </Pantalla>
  );
}
