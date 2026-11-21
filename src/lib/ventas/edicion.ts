import { z } from 'zod';
import { MEDIOS, type Medio, type MedioDeVenta } from '../caja/resultado';
import { montoParaEditar } from '../gastos/plata';
import type { EleccionDeCobro } from '../vender/cobro';
import type { DescuentoEscrito } from '../vender/descuento';
import type { CategoriaParaVender } from '../vender/catalogo';
import { esquemaVentaDelMostrador, ventaDelMostradorParaLaBase } from '../vender/esquemas';
import type { RenglonDelTicket } from '../vender/ticket';

const MOTIVO = 'Escribí el motivo del cambio.';

/** Editar una venta (pedido 102): lo mismo que se cobra en el mostrador, más la venta y el motivo. */
export const esquemaEdicionDeVenta = esquemaVentaDelMostrador.omit({ clave: true }).extend({
  id: z.uuid(),
  motivo: z.string().trim().min(3, MOTIVO).max(300, 'Usá hasta 300 caracteres.'),
});

export type EdicionDeVenta = z.infer<typeof esquemaEdicionDeVenta>;

/** Lo que recibe ventas_editar: la venta, los datos como el mostrador y el motivo. */
export function edicionParaLaBase(edicion: EdicionDeVenta) {
  const { renglones, pagos, descuento } = ventaDelMostradorParaLaBase({ ...edicion, clave: '' });
  const tipo = edicion.canalId ? { canal_id: edicion.canalId } : {};
  return {
    la_venta: edicion.id,
    datos: {
      ...tipo,
      renglones,
      pagos,
      ...(descuento ? { descuento } : {}),
      // Un precio a mano lleva motivo: al editar, el de la edición (pedido 102).
      ...(renglones.some((r) => 'precio_especial' in r) ? { motivo_precio: edicion.motivo } : {}),
    },
    el_motivo: edicion.motivo,
  };
}

export type RenglonGuardado = {
  precio_cambiado?: boolean;
  precio_unitario_centavos?: number;
  producto_id: string | null;
  presentacion_id: string | null;
  cantidad: number;
};

/**
 * El ticket de una venta guardada, con los precios del menú de hoy: al guardar se cobra a esos.
 * Lo pesado vuelve a gramos (1,2 cuartos son 300 g). Lo que ya no está en el menú no entra.
 */
export function ticketDeLaVenta(renglones: RenglonGuardado[], catalogo: CategoriaParaVender[]) {
  const formas = catalogo.flatMap((c) => c.productos.flatMap((p) => p.formas));
  const ticket: RenglonDelTicket[] = [];
  for (const r of renglones) {
    const forma = formas.find(
      (f) => f.productoId === r.producto_id && f.presentacionId === r.presentacion_id,
    );
    if (!forma) continue;
    const gramos = forma.gramosDeLaForma
      ? Math.round(r.cantidad * forma.gramosDeLaForma)
      : undefined;
    const especial = r.precio_cambiado ? { precioEspecial: r.precio_unitario_centavos } : {};
    ticket.push(
      gramos
        ? { ...forma, ...especial, cantidad: 1, gramos }
        : { ...forma, ...especial, cantidad: r.cantidad },
    );
  }
  return { ticket, faltan: renglones.length - ticket.length };
}

const MENSAJES: Record<string, string> = {
  '42501': 'No tenés permiso para editar ventas.',
  PV302: 'Sumá al menos un producto.',
  PV304: 'Uno de los productos ya no se vende. Sacalo de la venta.',
  PV305: 'Esta venta está anulada y ya no se puede cambiar.',
  PV310: 'Cambió un precio del menú. Revisá la venta antes de guardar.',
  PV311: 'Los pagos no suman el total. Revisá cómo se cobra.',
  PV316: 'Esa venta no está disponible. Recargá la página.',
  PV317: 'Esta venta vino de Fudo, antes de dejarlo: no se edita.',
  PV318: 'Pasaron más de 30 minutos desde que se cobró: pedile al admin que la edite.',
  PV319: MOTIVO,
  PV320: 'El descuento no es válido: revisá el número y el motivo.',
};

/** Lo que se le dice a quien edita cuando la base no deja guardar. */
export const mensajeDeEdicion = (codigo: string | undefined) =>
  MENSAJES[codigo ?? ''] ?? 'No pudimos guardar los cambios. Probá de nuevo.';

type PagoGuardado = { medio: MedioDeVenta; monto_centavos: number };

const medioQueSeOfrece = (medio: MedioDeVenta | undefined): Medio | null =>
  MEDIOS.find((m) => m === medio) ?? null;

/** Cómo viene elegido el cobro al editar: el medio de la venta, o los dos con lo del primero. */
export function eleccionDeLosPagos(pagos: PagoGuardado[]): EleccionDeCobro {
  const [primero, segundo] = pagos;
  return {
    medio: medioQueSeOfrece(primero?.medio),
    dosMedios: !!segundo,
    segundoMedio: medioQueSeOfrece(segundo?.medio),
    primeroEscrito: segundo && primero ? montoParaEditar(primero.monto_centavos) : '',
  };
}

const MARGEN_DE_CAJA = 30 * 60 * 1000;

type ParaEditar = { anulado: boolean; origen: string; cerrada_en: string | null };

/** Si quien mira puede editar la venta: el admin siempre; Caja, 30 minutos después de cobrarla. */
export function puedeEditar(venta: ParaEditar, estado: string, ahora: Date): boolean {
  if (venta.anulado || venta.origen === 'fudo') return false;
  if (estado === 'admin') return true;
  if (estado !== 'caja' || !venta.cerrada_en) return false;
  return ahora.getTime() - new Date(venta.cerrada_en).getTime() <= MARGEN_DE_CAJA;
}

/** Adónde lleva Vender al cobrar: a Ventas, con lo cobrado en efectivo para el vuelto. */
export function destinoAlCobrar(efectivoCentavos: number | null, armar: string | null = null) {
  const parametros = new URLSearchParams();
  if (efectivoCentavos) parametros.set('vuelto', String(efectivoCentavos));
  // Con facturas surtidas, la misma ventana trae el armado (pedido 102).
  if (armar) parametros.set('armar', armar);
  const texto = parametros.toString();
  return texto ? `/admin/ventas?${texto}` : '/admin/ventas';
}

/** El efectivo que trae la dirección para la ventana de vuelto, si es un monto entero. */
export function vueltoDeLaDireccion(texto: string | string[] | undefined): number | null {
  const valor = Array.isArray(texto) ? texto[0] : texto;
  return valor && /^\d{1,12}$/.test(valor) ? Number(valor) : null;
}

type ConDescuento = {
  descuento_centavos: number;
  descuento_porcentaje?: number | null;
  motivo_descuento: string | null;
};

/** El descuento de la venta para editarlo: como monto en pesos, con su motivo; null si no tuvo. */
export function descuentoDeLaVenta(venta: ConDescuento): DescuentoEscrito | null {
  if (!venta.descuento_centavos) return null;
  const motivo = venta.motivo_descuento ?? '';
  if (venta.descuento_porcentaje)
    return { tipo: 'porcentaje', valor: String(venta.descuento_porcentaje), motivo };
  const valor = montoParaEditar(venta.descuento_centavos);
  return { tipo: 'monto', valor, motivo: venta.motivo_descuento ?? '' };
}
