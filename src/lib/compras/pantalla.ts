import { fechaParaMostrar } from '../gastos/pantalla';
import { contenidoParaEditar } from '../materia-prima/esquemas';
import { unValor } from '../usuarios/presentacion';

export type EstadoDeLista = 'todas' | 'pedida' | 'recibida' | 'anulada';
export type FiltrosDeCompras = { estado: EstadoDeLista; proveedor: string | null };
export type ParametrosDeCompras = Record<string, string | string[] | undefined>;
type RenglonDelPedido = { insumo: string; comoSeCompra: string; cantidad: number };

const ESTADOS: EstadoDeLista[] = ['todas', 'pedida', 'recibida', 'anulada'];

/** El mensaje que se le manda al proveedor por WhatsApp. */
export function textoDelPedido(renglones: RenglonDelPedido[]): string {
  const lineas = renglones.map(
    (r) => `- ${contenidoParaEditar(r.cantidad)} × ${r.insumo} (${r.comoSeCompra})`,
  );
  return ['Hola, te hago un pedido para Manteca:', ...lineas, 'Gracias.'].join('\n');
}

/** El chat del proveedor con el pedido escrito; sin telefono, no hay enlace. */
export function enlaceDelPedido(telefono: string | null, texto: string): string | null {
  return telefono ? `https://wa.me/${telefono}?text=${encodeURIComponent(texto)}` : null;
}

/** El total que se va a guardar, para mostrarlo mientras se carga: lo calcula igual la base. */
export function totalDeLaCompra(
  renglones: { cantidad: number; precioCentavos: number }[],
  otrosCentavos: number,
): number {
  const subtotales = renglones.map((r) => Math.round(r.cantidad * r.precioCentavos));
  return subtotales.reduce((suma, subtotal) => suma + subtotal, otrosCentavos);
}

export function estadoDeCompra(compra: { estado: 'pedida' | 'recibida'; anulado: boolean }) {
  if (compra.anulado) return 'Anulada';
  return compra.estado === 'pedida' ? 'Pedida' : 'Recibida';
}

export function pagoDeCompra({
  gasto,
  vencimiento,
}: {
  gasto: boolean;
  vencimiento: string | null;
}) {
  if (gasto) return 'Pagada';
  return vencimiento ? `Por pagar, vence el ${fechaParaMostrar(vencimiento)}` : '—';
}

/** El estado y el proveedor de la lista, leidos de la URL. */
export function filtrosDeCompras(parametros: ParametrosDeCompras): FiltrosDeCompras {
  const estado = unValor(parametros.estado) as EstadoDeLista;
  return {
    estado: ESTADOS.includes(estado) ? estado : 'todas',
    proveedor: unValor(parametros.proveedor) || null,
  };
}

export function enlaceDeCompras({ estado, proveedor }: FiltrosDeCompras): string {
  const parametros = new URLSearchParams();
  if (estado !== 'todas') parametros.set('estado', estado);
  if (proveedor) parametros.set('proveedor', proveedor);
  const texto = parametros.toString();
  return texto ? `/admin/compras?${texto}` : '/admin/compras';
}
