'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { useGuardar } from '@/lib/gastos/useGuardar';
import type { CategoriaParaVender } from '@/lib/vender/catalogo';
import { estadoDelCobro, type EleccionDeCobro } from '@/lib/vender/cobro';
import type { TipoParaVender } from '@/lib/vender/consultas';
import { ventaDelTicket } from '@/lib/vender/esquemas';
import { descuentoEnCentavos, type DescuentoEscrito } from '@/lib/vender/descuento';
import type { RenglonDelTicket } from '@/lib/vender/ticket';
import { useDescuento, useEleccion, useTicket } from '@/lib/vender/useMostrador';
import { usePasos } from '@/lib/vender/usePasos';
import { BarraDePasos } from '../../../vender/BarraDePasos';
import { CobroDelMostrador } from '../../../vender/CobroDelMostrador';
import { Descuento } from '../../../vender/Descuento';
import { ElegirTipo } from '../../../vender/ElegirTipo';
import { PasoDeProductos } from '../../../vender/PasoDeProductos';
import { PieDelPaso } from '../../../vender/PieDelPaso';
import { editarVentaDesdeElPanel } from '../../acciones';

type Props = {
  id: string;
  catalogo: CategoriaParaVender[];
  tipos: TipoParaVender[];
  inicial: {
    ticket: RenglonDelTicket[];
    tipo: string | null;
    eleccion: EleccionDeCobro;
    descuento: DescuentoEscrito | null;
  };
};

function Motivo({ valor, cambiar }: { valor: string; cambiar: (texto: string) => void }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        Motivo del cambio
      </span>
      <textarea
        value={valor}
        onChange={(e) => cambiar(e.target.value)}
        rows={2}
        maxLength={300}
        placeholder="Ej: se cobró con otro medio"
        className="w-full rounded-2xl border-2 border-border bg-white px-4 py-3 text-sm outline-none focus:border-foreground"
      />
    </label>
  );
}

/** Vender por pasos con la venta cargada: al final se escribe el motivo y se guarda el cambio. */
export function EditorDeVenta({ id, catalogo, tipos, inicial }: Props) {
  const router = useRouter();
  const pasos = usePasos(tipos, inicial.tipo);
  const ticket = useTicket(catalogo, inicial.ticket);
  const eleccion = useEleccion(inicial.eleccion);
  const [motivo, setMotivo] = useState('');
  const descuento = useDescuento(inicial.descuento);
  const descontado = descuentoEnCentavos(ticket.totalCentavos, descuento.elegido);
  const total = ticket.totalCentavos - descontado;
  const cobro = estadoDelCobro(total, eleccion.eleccion, eleccion.pagaCon);
  const guardado = useGuardar(editarVentaDesdeElPanel, () => {
    toast.success('Venta editada');
    router.push(`/admin/ventas/${id}`);
  });
  const tipo = pasos.tipo === pasos.local ? null : pasos.tipo;
  const guardar = () =>
    cobro.pagos &&
    guardado.enviar({
      id,
      motivo,
      ...ventaDelTicket(ticket.ticket, cobro.pagos, tipo, descuento.elegido ?? undefined),
    });
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
          enviando={guardado.enviando}
          mensaje={guardado.mensaje}
          descuento={<Descuento {...descuento} descuentoCentavos={descontado} />}
          resumen={`${ticket.ticket.length} productos · ${pasos.nombreDelTipo}`}
          antesDelBoton={<Motivo valor={motivo} cambiar={setMotivo} />}
          boton="Guardar cambios"
          listo={motivo.trim().length >= 3}
          cobrar={guardar}
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
