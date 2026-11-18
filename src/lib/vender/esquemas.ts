import { z } from 'zod';
import { MEDIOS } from '../caja/resultado';

const CANTIDAD = 'La cantidad es un número entero, desde 1.';

const renglon = z.object({
  productoId: z.uuid('Elegí el producto.'),
  presentacionId: z.uuid('Elegí cómo se vende.'),
  cantidad: z.number().int(CANTIDAD).min(1, CANTIDAD),
  // El precio que vio quien vende: si en la base ya es otro, la venta no se guarda.
  precioCentavos: z.number().int().positive(),
});

const pago = z.object({
  medio: z.enum(MEDIOS, 'Elegí cómo se cobra.'),
  montoCentavos: z.number().int().positive('Cada medio lleva más de $0.'),
});

type Renglon = z.infer<typeof renglon>;
type Pago = z.infer<typeof pago>;

const sinRepetir = (pagos: Pago[]) => new Set(pagos.map((p) => p.medio)).size === pagos.length;

const totalDeRenglones = (renglones: Renglon[]) =>
  renglones.reduce((suma, r) => suma + r.precioCentavos * r.cantidad, 0);

const sumaDePagos = (pagos: Pago[]) => pagos.reduce((suma, p) => suma + p.montoCentavos, 0);

export const esquemaVentaDelMostrador = z
  .object({
    // La pone la pantalla al armar el ticket: la misma venta mandada dos veces no se duplica.
    clave: z.uuid(),
    renglones: z.array(renglon).min(1, 'Sumá al menos un producto.'),
    pagos: z
      .array(pago)
      .min(1, 'Elegí cómo se cobra.')
      .max(2, 'Se cobra con uno o dos medios.')
      .refine(sinRepetir, 'Elegí dos medios distintos.'),
  })
  .refine((venta) => sumaDePagos(venta.pagos) === totalDeRenglones(venta.renglones), {
    message: 'Los pagos no suman el total.',
    path: ['pagos'],
  });

export type VentaDelMostrador = z.infer<typeof esquemaVentaDelMostrador>;

/** Lo que recibe la función de la base, que vuelve a calcular los precios y el total. */
export function ventaDelMostradorParaLaBase(venta: VentaDelMostrador) {
  return {
    clave: venta.clave,
    renglones: venta.renglones.map((r) => ({
      producto_id: r.productoId,
      presentacion_id: r.presentacionId,
      cantidad: r.cantidad,
      precio_centavos: r.precioCentavos,
    })),
    pagos: venta.pagos.map((p) => ({ medio: p.medio, monto_centavos: p.montoCentavos })),
  };
}
