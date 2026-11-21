import { z } from 'zod';
import { MEDIOS } from '../caja/resultado';
import type { PagoDelMostrador } from './pagos';
import type { RenglonDelTicket } from './ticket';

const CANTIDAD = 'La cantidad es un número entero, desde 1.';

const renglon = z.object({
  // Las surtidas no llevan producto: se arman después de cobrar (pedido 102).
  productoId: z.string().min(1, 'Elegí el producto.'),
  surtida: z.boolean().optional(),
  presentacionId: z.uuid('Elegí cómo se vende.'),
  cantidad: z.number().int(CANTIDAD).min(1, CANTIDAD),
  // El precio que vio quien vende: si en la base ya es otro, la venta no se guarda.
  precioCentavos: z.number().int().positive(),
  // Lo pesado, en gramos (pedido 102); la base lo cobra en proporción a la forma.
  gramos: z
    .number()
    .int()
    .min(1, 'Escribí el peso.')
    .max(99999, 'Ese peso es demasiado.')
    .optional(),
  // El precio escrito a mano (pedido 102): la venta lleva el motivo.
  precioEspecial: z.number().int().positive().optional(),
});

const pago = z.object({
  medio: z.enum(MEDIOS, 'Elegí cómo se cobra.'),
  montoCentavos: z.number().int().positive('Cada medio lleva más de $0.'),
});

type Pago = z.infer<typeof pago>;

const sinRepetir = (pagos: Pago[]) => new Set(pagos.map((p) => p.medio)).size === pagos.length;

// Que los pagos sumen el total lo controla la base, que hace la cuenta con la docena variada.
// El descuento en el cobro (pedido 102): la base lo calcula y lo controla.
const descuento = z.object({
  tipo: z.enum(['porcentaje', 'monto', 'total']),
  valor: z.number().int().positive(),
  motivo: z.string().trim().min(3, 'Escribí el motivo del descuento.').max(300),
});

export const esquemaVentaDelMostrador = z.object({
  // La pone la pantalla al armar el ticket: la misma venta mandada dos veces no se duplica.
  clave: z.uuid(),
  // El tipo de venta elegido; sin elegir, la base pone Local (pedido 99).
  canalId: z.uuid().optional(),
  renglones: z.array(renglon).min(1, 'Sumá al menos un producto.'),
  pagos: z
    .array(pago)
    .min(1, 'Elegí cómo se cobra.')
    .max(2, 'Se cobra con uno o dos medios.')
    .refine(sinRepetir, 'Elegí dos medios distintos.'),
  descuento: descuento.optional(),
  motivoPrecio: z
    .string()
    .trim()
    .min(3, 'Escribí por qué cambiaste el precio.')
    .max(300)
    .optional(),
});

export type VentaDelMostrador = z.infer<typeof esquemaVentaDelMostrador>;

/** Lo que recibe la función de la base, que vuelve a calcular los precios y el total. */
export function ventaDelMostradorParaLaBase(venta: VentaDelMostrador) {
  return {
    clave: venta.clave,
    ...(venta.canalId ? { canal_id: venta.canalId } : {}),
    renglones: venta.renglones.map((r) => ({
      ...(r.surtida ? { surtida: true } : { producto_id: r.productoId }),
      presentacion_id: r.presentacionId,
      cantidad: r.cantidad,
      precio_centavos: r.precioCentavos,
      ...(r.gramos ? { gramos: r.gramos } : {}),
      ...(r.precioEspecial ? { precio_especial: r.precioEspecial } : {}),
    })),
    pagos: venta.pagos.map((p) => ({ medio: p.medio, monto_centavos: p.montoCentavos })),
    ...(venta.motivoPrecio ? { motivo_precio: venta.motivoPrecio } : {}),
    ...(venta.descuento ? { descuento: venta.descuento } : {}),
  };
}

const renglonParaMandar = (r: RenglonDelTicket) => ({
  ...(r.surtida ? { surtida: true } : {}),
  productoId: r.productoId,
  presentacionId: r.presentacionId,
  cantidad: r.cantidad,
  precioCentavos: r.precioCentavos,
  ...(r.gramos ? { gramos: r.gramos } : {}),
  ...(r.precioEspecial ? { precioEspecial: r.precioEspecial } : {}),
});

/** Lo que se manda al cobrar, sin la clave: la pone quien guarda. */
export function ventaDelTicket(
  ticket: RenglonDelTicket[],
  pagos: PagoDelMostrador[],
  canalId: string | null = null,
  descuento: VentaDelMostrador['descuento'] = undefined,
): Omit<VentaDelMostrador, 'clave'> {
  return {
    ...(descuento ? { descuento } : {}),
    ...(canalId ? { canalId } : {}),
    renglones: ticket.map(renglonParaMandar),
    pagos,
  };
}
