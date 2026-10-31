import { EnlaceDeVolver } from '@/components/panel/EnlaceDeVolver';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FranjaDeAviso } from '@/components/panel/Avisos';
import { BotonDeAnular } from '@/components/panel/BotonDeAnular';
import { CargadoPor } from '@/components/panel/CargadoPor';
import { InsigniaDeEstado } from '@/components/panel/Insignias';
import { Pantalla } from '@/components/panel/Pantalla';
import { Dato, Datos, Seccion } from '@/components/panel/Seccion';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { formatearPesos } from '@/lib/plata';
import { ventaPorId, type Venta } from '@/lib/ventas/consultas';
import { estadoDeVenta, horaDeVenta, tonoDeEstado } from '@/lib/ventas/pantalla';
import { cantidadParaMostrar } from '@/lib/ventas/renglones';
import { anularVentaDesdeElPanel } from '../acciones';
import { MediosDePago, OrigenDeVenta } from '../OrigenYMedio';

export const metadata: Metadata = { title: 'Venta' };

function Renglones({ venta }: { venta: Venta }) {
  if (venta.renglones.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Esta venta no tiene detalle de productos: Fudo trae solo el total.
      </p>
    );
  }
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
  const hora = horaDeVenta(venta.fecha, venta.cerrada_en);
  return (
    <Seccion titulo="Lo vendido" forma="lista">
      <Renglones venta={venta} />
      <p className="text-lg font-bold">Total: {formatearPesos(venta.total_centavos)}</p>
      <Datos>
        <Dato titulo="Origen" valor={<OrigenDeVenta origen={venta.origen} />} />
        <Dato titulo="Tipo de venta" valor={venta.canal} />
        <Dato titulo="Hora" valor={hora} />
        <Dato
          titulo="Cobrado con"
          valor={<MediosDePago medios={venta.pagos.map((p) => p.medio)} />}
        />
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
  const { id } = await params;
  const { cliente, datos: venta } = await exigirPaginaYLeer('admin', (cliente) =>
    ventaPorId(cliente, id),
  );
  if (!venta) notFound();
  return (
    <Pantalla
      titulo={`Venta del ${fechaParaMostrar(venta.fecha)}`}
      subtitulo="El detalle de lo que se vendió."
      ayuda="ventas"
    >
      <div>
        <InsigniaDeEstado tono={tonoDeEstado(venta)}>{estadoDeVenta(venta)}</InsigniaDeEstado>
      </div>
      <CargadoPor cliente={cliente} tabla="ventas" id={venta.id} />
      <Resumen venta={venta} />
      <Acciones venta={venta} />
      <EnlaceDeVolver href="/admin/ventas">Volver a ventas</EnlaceDeVolver>
    </Pantalla>
  );
}
