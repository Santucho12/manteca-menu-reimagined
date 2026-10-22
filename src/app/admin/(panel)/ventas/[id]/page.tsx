import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FranjaDeAviso } from '@/components/panel/Avisos';
import { BotonDeAnular } from '@/components/panel/BotonDeAnular';
import { CargadoPor } from '@/components/panel/CargadoPor';
import { InsigniaDeEstado } from '@/components/panel/Insignias';
import { Pantalla } from '@/components/panel/Pantalla';
import { Dato, Datos, Seccion } from '@/components/panel/Seccion';
import { exigirPagina } from '@/lib/acceso/servidor';
import { nombreDeMedio } from '@/lib/caja/pantalla';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { formatearPesos } from '@/lib/plata';
import { ventaPorId, type Venta } from '@/lib/ventas/consultas';
import { estadoDeVenta, nombreDeOrigen } from '@/lib/ventas/pantalla';
import { cantidadParaMostrar } from '@/lib/ventas/renglones';
import { anularVentaDesdeElPanel } from '../acciones';

export const metadata: Metadata = { title: 'Venta' };

function Renglones({ venta }: { venta: Venta }) {
  return (
    <ul aria-label="Productos" className="divide-y divide-border">
      {venta.renglones.map((renglon) => (
        <li key={renglon.id} className="flex items-start justify-between gap-3 py-3">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-bold break-words">{renglon.descripcion}</p>
            <p className="text-xs text-muted-foreground">
              {cantidadParaMostrar(renglon.cantidad)} ×{' '}
              {formatearPesos(renglon.precio_unitario_centavos)}
            </p>
          </div>
          <span className="text-sm font-bold whitespace-nowrap">
            {formatearPesos(renglon.subtotal_centavos)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Resumen({ venta }: { venta: Venta }) {
  const pagos = venta.pagos.map(
    (p) => `${nombreDeMedio(p.medio)} ${formatearPesos(p.monto_centavos)}`,
  );
  return (
    <Seccion titulo="Lo vendido" forma="lista">
      <Renglones venta={venta} />
      <p className="text-lg font-bold">Total: {formatearPesos(venta.total_centavos)}</p>
      <Datos>
        <Dato titulo="Origen" valor={nombreDeOrigen(venta.origen)} />
        <Dato titulo="Canal" valor={venta.canal} />
        <Dato titulo="Cobrado con" valor={pagos.join(' · ') || null} />
      </Datos>
      {venta.comentario ? <p className="text-sm whitespace-pre-line">{venta.comentario}</p> : null}
    </Seccion>
  );
}

// Lo que se puede hacer con la venta: anular la de a mano; la de Fudo se corrige alla.
function Acciones({ venta }: { venta: Venta }) {
  if (venta.anulado)
    return (
      <FranjaDeAviso>
        <p>Anulada: {venta.motivo_anulacion}</p>
      </FranjaDeAviso>
    );
  if (venta.origen === 'fudo') {
    return (
      <FranjaDeAviso>
        <p>Las ventas de Fudo se corrigen en Fudo.</p>
      </FranjaDeAviso>
    );
  }
  return <BotonDeAnular id={venta.id} anular={anularVentaDesdeElPanel} titulo="Anular la venta" />;
}

export default async function FichaDeVenta({ params }: { params: Promise<{ id: string }> }) {
  const { cliente } = await exigirPagina('admin');
  const venta = await ventaPorId(cliente, (await params).id);
  if (!venta) notFound();
  return (
    <Pantalla
      titulo={`Venta del ${fechaParaMostrar(venta.fecha)}`}
      subtitulo="El detalle de lo que se vendió."
      ayuda="ventas"
    >
      <div>
        <InsigniaDeEstado tono={venta.anulado ? 'pizarra' : 'esmeralda'}>
          {estadoDeVenta(venta)}
        </InsigniaDeEstado>
      </div>
      <CargadoPor cliente={cliente} tabla="ventas" id={venta.id} />
      <Resumen venta={venta} />
      <Acciones venta={venta} />
      <Link
        href="/admin/ventas"
        className="inline-block text-sm font-semibold text-muted-foreground hover:text-primary"
      >
        Volver a ventas
      </Link>
    </Pantalla>
  );
}
