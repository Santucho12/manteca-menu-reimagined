import { EnlaceDeVolver } from '@/components/panel/EnlaceDeVolver';
import type { Metadata } from 'next';
import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FranjaDeAviso } from '@/components/panel/Avisos';
import { BotonDeAnular } from '@/components/panel/BotonDeAnular';
import { CargadoPor } from '@/components/panel/CargadoPor';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { ventaPorId, type Venta } from '@/lib/ventas/consultas';
import { puedeEditar } from '@/lib/ventas/edicion';
import { ACCESO_SECUNDARIO, ICONO_DE_ACCESO_SUAVE } from '@/components/panel/estilos';
import { horaDeVenta, subtituloDeVenta } from '@/lib/ventas/pantalla';
import { anularVentaDesdeElPanel } from '../acciones';
import { AvisoDeAnulada, DatosDeLaVenta, TicketDeLaVenta } from './PartesDeLaVenta';

export const metadata: Metadata = { title: 'Venta' };

function Editar({ venta }: { venta: Venta }) {
  return (
    <Link href={`/admin/ventas/${venta.id}/editar`} className={ACCESO_SECUNDARIO}>
      <span className={ICONO_DE_ACCESO_SUAVE}>
        <Pencil size={15} aria-hidden="true" />
      </span>
      Editar
    </Link>
  );
}

// Lo que se puede hacer con la venta: editarla (pedido 102) y, el admin, anularla. Las viejas de
// Fudo no se tocan (PV307).
function Acciones({ venta, estado }: { venta: Venta; estado: string }) {
  const editar = puedeEditar(venta, estado, new Date()) ? <Editar venta={venta} /> : null;
  if (venta.anulado) return null;
  if (estado !== 'admin') return editar;
  if (venta.origen === 'fudo') {
    return (
      <FranjaDeAviso>
        <p>Vino de Fudo, antes de dejarlo: no se anula.</p>
      </FranjaDeAviso>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      {editar}
      <BotonDeAnular id={venta.id} anular={anularVentaDesdeElPanel} titulo="Anular la venta" />
    </div>
  );
}

export default async function FichaDeVenta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // El admin y Caja: a Caja la base le muestra solo las de los últimos 30 minutos (pedido 102).
  const {
    cliente,
    estado,
    datos: venta,
  } = await exigirPaginaYLeer('caja', (cliente) => ventaPorId(cliente, id));
  if (!venta) notFound();
  const hora = horaDeVenta(venta.fecha, venta.cerrada_en);
  const pie = (
    <div className="space-y-4 border-t border-border pt-4">
      <CargadoPor cliente={cliente} tabla="ventas" id={venta.id} />
      <Acciones venta={venta} estado={estado} />
    </div>
  );
  return (
    <Pantalla
      titulo={`Venta del ${fechaParaMostrar(venta.fecha)}`}
      subtitulo={subtituloDeVenta({ hora, canal: venta.canal })}
      ayuda="ventas"
    >
      <AvisoDeAnulada venta={venta} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TicketDeLaVenta venta={venta} />
        </div>
        <DatosDeLaVenta venta={venta} pie={pie} />
      </div>
      <EnlaceDeVolver href="/admin/ventas">Volver a ventas</EnlaceDeVolver>
    </Pantalla>
  );
}
