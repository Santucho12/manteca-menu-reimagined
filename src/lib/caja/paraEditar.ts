import { montoParaEditar } from '../gastos/plata';
import type { Cierre } from './consultas';
import type { DatosDeCierre } from './esquemas';

type DeUnCierre = Pick<
  Cierre,
  | 'fecha'
  | 'turno'
  | 'fondoInicialCentavos'
  | 'quedaEnCajaCentavos'
  | 'comentario'
  | 'declarados'
  | 'retiros'
  | 'gastos'
  | 'controles'
>;

// Un medio sin ventas se deja vacio, como lo escribe la persona.
const monto = (centavos: number) => (centavos === 0 ? '' : montoParaEditar(centavos));

const salidasParaEditar = ({ retiros, gastos }: Pick<DeUnCierre, 'retiros' | 'gastos'>) => ({
  retiros: retiros.map((r) => ({ monto: montoParaEditar(r.monto_centavos), quien: r.quien })),
  gastos: gastos
    .filter((g) => !g.anulado)
    .map((g) => ({ monto: montoParaEditar(g.monto_centavos), descripcion: g.descripcion ?? '' })),
});

/** El formulario de un cierre ya guardado: lo declarado, sus retiros y sus gastos sin anular. */
export function datosParaEditar(cierre: DeUnCierre): DatosDeCierre {
  const { declarados } = cierre;
  return {
    fecha: cierre.fecha,
    turno: cierre.turno === 1 ? '1' : '2',
    fondoInicial: montoParaEditar(cierre.fondoInicialCentavos),
    efectivo: montoParaEditar(declarados.efectivo),
    credito: monto(declarados.credito),
    debito: monto(declarados.debito),
    qr: monto(declarados.qr),
    transferencia: monto(declarados.transferencia),
    quedaEnCaja: montoParaEditar(cierre.quedaEnCajaCentavos),
    comentario: cierre.comentario ?? '',
    ...salidasParaEditar(cierre),
    controles: cierre.controles.map((c) => ({
      canalId: c.canalId,
      total: montoParaEditar(c.anotadoCentavos),
      cantidad: c.cantidadAnotada === null ? '' : String(c.cantidadAnotada),
    })),
  };
}
