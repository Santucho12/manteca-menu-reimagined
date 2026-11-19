import { PackageCheck, Send } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ENLACE_EN_TEXTO } from '@/components/panel/Avisos';
import { BotonDeAnular } from '@/components/panel/BotonDeAnular';
import { CargadoPor } from '@/components/panel/CargadoPor';
import { EnlaceDeVolver } from '@/components/panel/EnlaceDeVolver';
import { BOTON_DE_ENCABEZADO, BOTON_DE_ENCABEZADO_NEUTRO } from '@/components/panel/estilos';
import { Pantalla } from '@/components/panel/Pantalla';
import { Dato, Datos, Seccion } from '@/components/panel/Seccion';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { compraPorId, type Compra } from '@/lib/compras/consultas';
import {
  enlaceDelPedido,
  estadoDeCompra,
  pagoDeCompra,
  textoDelPedido,
} from '@/lib/compras/pantalla';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { contenidoParaEditar } from '@/lib/materia-prima/esquemas';
import { formatearPesos } from '@/lib/plata';
import { anularCompraDesdeElPanel } from '../acciones';

export const metadata: Metadata = { title: 'Compra' };

function Acciones({ compra }: { compra: Compra }) {
  if (compra.anulado || compra.estado !== 'pedida') return null;
  const texto = textoDelPedido(
    compra.renglonesDeLaCompra.map((r) => ({
      insumo: r.insumo,
      comoSeCompra: r.comoSeCompra,
      cantidad: r.cantidadPedida ?? r.cantidad,
    })),
  );
  const whatsapp = enlaceDelPedido(compra.telefono, texto);
  return (
    <>
      <Link href={`/admin/compras/nueva?pedido=${compra.id}`} className={BOTON_DE_ENCABEZADO}>
        <PackageCheck size={18} aria-hidden="true" /> Recibir
      </Link>
      {whatsapp ? (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className={BOTON_DE_ENCABEZADO_NEUTRO}
        >
          <Send size={18} aria-hidden="true" /> Mandar por WhatsApp
        </a>
      ) : null}
    </>
  );
}

function Renglones({ compra }: { compra: Compra }) {
  const pedida = compra.estado === 'pedida';
  return (
    <Seccion titulo="Renglones" forma="lista">
      <ul aria-label="Renglones" className="divide-y divide-border">
        {compra.renglonesDeLaCompra.map((r) => (
          <li key={r.formaId} className="flex flex-wrap justify-between gap-3 py-3 text-sm">
            <span className="wrap-break-word">
              {contenidoParaEditar(pedida ? (r.cantidadPedida ?? 0) : r.cantidad)} × {r.insumo} (
              {r.comoSeCompra})
            </span>
            {pedida ? null : (
              <span className="font-bold whitespace-nowrap">
                {formatearPesos(r.precioCentavos)} c/u · {formatearPesos(r.subtotalCentavos)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </Seccion>
  );
}

function DatosDeLaCompra({ compra }: { compra: Compra }) {
  const pago = pagoDeCompra({ gasto: compra.pagada, vencimiento: compra.vencimiento });
  return (
    <Seccion forma="lista">
      <Datos>
        <Dato titulo="Estado" valor={estadoDeCompra(compra)} />
        <Dato
          titulo="Llegó"
          valor={compra.fecha ? fechaParaMostrar(compra.fecha) : 'Sin recibir'}
        />
        <Dato titulo="Factura" valor={compra.factura} />
        <Dato titulo="Otros cargos" valor={formatearPesos(compra.otrosCargosCentavos)} />
        <Dato titulo="Total" valor={formatearPesos(compra.total_centavos)} />
        <Dato titulo="Pago" valor={pago} />
        {compra.motivoAnulacion ? (
          <Dato titulo="Motivo de la anulación" valor={compra.motivoAnulacion} />
        ) : null}
      </Datos>
      {compra.gastoId ? (
        <Link href={`/admin/gastos/${compra.gastoId}`} className={ENLACE_EN_TEXTO}>
          Ver el gasto de esta compra
        </Link>
      ) : null}
    </Seccion>
  );
}

export default async function DetalleDeCompra({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { cliente, datos: compra } = await exigirPaginaYLeer('admin', (c) => compraPorId(c, id));
  if (!compra) notFound();
  return (
    <Pantalla
      titulo={`Compra a ${compra.proveedor}`}
      subtitulo="Lo que llegó, a qué precio y cómo se pagó."
      acciones={<Acciones compra={compra} />}
      ayuda="compras"
    >
      <CargadoPor cliente={cliente} tabla="compras" id={compra.id} />
      <DatosDeLaCompra compra={compra} />
      <Renglones compra={compra} />
      {compra.anulado ? null : (
        <BotonDeAnular
          id={compra.id}
          anular={anularCompraDesdeElPanel}
          titulo="Anular la compra"
          aviso="Compra anulada"
        />
      )}
      <EnlaceDeVolver href="/admin/compras">Volver a compras</EnlaceDeVolver>
    </Pantalla>
  );
}
