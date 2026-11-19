import { z } from 'zod';
import { centavosDeMonto } from '../gastos/plata';
import { esFechaValida } from '../gastos/vencimientos';
import { contenidoDeTexto } from '../materia-prima/esquemas';

export const MEDIOS_DE_COMPRA = ['transferencia', 'efectivo', 'tarjeta', 'cheque', 'otro'] as const;

const CANTIDAD = 'Escribí la cantidad, con coma para los decimales: 2 o 1,5.';
const MONTO = 'Escribí el monto en pesos, con coma para los centavos: 32.000 o 1.250,50.';
const fecha = z.string().refine(esFechaValida, 'Elegí una fecha válida.');
const cantidad = z.string().refine((escrito) => contenidoDeTexto(escrito) !== undefined, CANTIDAD);
// Vacio es cero: una bonificacion, o sin otros cargos.
const montoOCero = z
  .string()
  .refine((escrito) => escrito.trim() === '' || centavosDeMonto(escrito) !== undefined, MONTO);
const centavos = (escrito: string) => centavosDeMonto(escrito) ?? 0;

const renglonRecibido = z.object({
  formaId: z.uuid('Elegí qué compraste.'),
  cantidad,
  precio: montoOCero,
});

export const esquemaCompra = z
  .object({
    compraId: z.union([z.literal(''), z.uuid()]),
    proveedorId: z.uuid('Elegí el proveedor.'),
    fecha,
    renglones: z.array(renglonRecibido).min(1, 'Agregá al menos un renglón.'),
    otrosCargos: montoOCero,
    factura: z.string().trim().max(60, 'Usá hasta 60 caracteres.'),
    pago: z.enum(['pagada', 'por_pagar'], 'Elegí si ya la pagaste.'),
    medio: z.enum(MEDIOS_DE_COMPRA, 'Elegí cómo se pagó.'),
    fechaDePago: z.string(),
    vencimiento: z.string(),
  })
  .superRefine((datos, contexto) => {
    const falta = datos.pago === 'pagada' ? 'fechaDePago' : 'vencimiento';
    if (!esFechaValida(datos[falta])) {
      contexto.addIssue({ code: 'custom', path: [falta], message: 'Elegí una fecha válida.' });
    }
  });

export const esquemaPedido = z.object({
  proveedorId: z.uuid('Elegí el proveedor.'),
  renglones: z
    .array(z.object({ formaId: z.uuid('Elegí qué pedís.'), cantidad }))
    .min(1, 'Agregá al menos un renglón.'),
});

export const esquemaAnularCompra = z.object({
  id: z.uuid(),
  motivo: z.string().trim().min(1, 'Escribí el motivo.').max(300, 'Usá hasta 300 caracteres.'),
});

export const esquemaDesdeGasto = z.object({
  gastoId: z.uuid(),
  proveedorId: z.uuid('Elegí el proveedor.'),
  renglones: z.array(renglonRecibido).min(1, 'Agregá al menos un renglón.'),
  factura: z.string().trim().max(60, 'Usá hasta 60 caracteres.'),
});

export type DatosDeCompra = z.infer<typeof esquemaCompra>;
export type DatosDePedido = z.infer<typeof esquemaPedido>;
export type DatosDesdeGasto = z.infer<typeof esquemaDesdeGasto>;
type RenglonRecibido = z.infer<typeof renglonRecibido>;

const renglonParaLaBase = (r: RenglonRecibido) => ({
  forma_de_compra_id: r.formaId,
  cantidad: contenidoDeTexto(r.cantidad)!,
  precio_unitario_centavos: centavos(r.precio),
});

function pagoParaLaBase(datos: DatosDeCompra) {
  return datos.pago === 'pagada'
    ? { tipo: 'pagada', medio: datos.medio, fecha: datos.fechaDePago }
    : { tipo: 'por_pagar', vencimiento: datos.vencimiento };
}

/** Lo que recibe compras_recibir: centavos, cantidades leidas y la clave de esta carga. */
export function compraParaLaBase(datos: DatosDeCompra, clave: string) {
  return {
    compra_id: datos.compraId === '' ? null : datos.compraId,
    proveedor_id: datos.proveedorId,
    fecha: datos.fecha,
    renglones: datos.renglones.map(renglonParaLaBase),
    otros_cargos_centavos: centavos(datos.otrosCargos),
    factura: datos.factura.trim(),
    pago: pagoParaLaBase(datos),
    clave,
  };
}

export function pedidoParaLaBase(datos: DatosDePedido, clave: string) {
  return {
    proveedor_id: datos.proveedorId,
    renglones: datos.renglones.map((r) => ({
      forma_de_compra_id: r.formaId,
      cantidad: contenidoDeTexto(r.cantidad)!,
    })),
    clave,
  };
}

export function desdeGastoParaLaBase(datos: DatosDesdeGasto, clave: string) {
  return {
    gasto_id: datos.gastoId,
    proveedor_id: datos.proveedorId,
    renglones: datos.renglones.map(renglonParaLaBase),
    factura: datos.factura.trim(),
    clave,
  };
}
