import { z } from 'zod';
import { centavosDeCaja } from '../caja/esquemas';
import { MEDIOS } from '../caja/resultado';
import { esFechaValida } from '../gastos/vencimientos';
import { cantidadDe } from './renglones';

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
// El selector guarda producto y presentacion juntos: "producto|presentacion".
const OPCION = new RegExp(`^${UUID}\\|${UUID}$`, 'i');

const renglon = z.object({
  opcion: z.string().regex(OPCION, 'Elegí el producto.'),
  cantidad: z
    .string()
    .refine(
      (texto) => cantidadDe(texto) !== undefined,
      'Escribí la cantidad, con coma para los decimales: 1,5.',
    ),
  precio: z
    .string()
    .trim()
    .min(1, 'Escribí el precio.')
    .refine(
      (texto) => centavosDeCaja(texto) !== undefined,
      'Escribí el precio en pesos, con coma para los centavos: 12.345,50.',
    ),
});

export const esquemaVenta = z.object({
  // La pone el formulario al abrirse: la misma venta mandada dos veces no se duplica.
  clave: z.uuid(),
  fecha: z.string().refine(esFechaValida, 'Elegí una fecha válida.'),
  canalId: z.uuid('Elegí el canal.'),
  medio: z.enum(MEDIOS, 'Elegí cómo se cobró.'),
  comentario: z.string().trim().max(500, 'Usá hasta 500 caracteres.'),
  renglones: z.array(renglon).min(1, 'Sumá al menos un producto.'),
});

export const esquemaAnulacionDeVenta = z.object({
  id: z.uuid(),
  motivo: z.string().trim().min(1, 'Escribí el motivo.').max(300, 'Usá hasta 300 caracteres.'),
});
export const esquemaCanal = z.object({
  nombre: z.string().trim().min(1, 'Escribí el nombre.').max(60, 'Usá hasta 60 caracteres.'),
});

export type DatosDeVenta = z.infer<typeof esquemaVenta>;
export type RenglonDeVenta = z.infer<typeof renglon>;

function renglonParaLaBase(r: RenglonDeVenta) {
  const [productoId, presentacionId] = r.opcion.split('|') as [string, string];
  return {
    producto_id: productoId,
    presentacion_id: presentacionId,
    cantidad: cantidadDe(r.cantidad)!,
    precio_unitario_centavos: centavosDeCaja(r.precio)!,
  };
}

/** Lo que recibe la funcion de la base: los totales los calcula ella. */
export function ventaParaLaBase(datos: DatosDeVenta) {
  return {
    clave: datos.clave,
    fecha: datos.fecha,
    canal_id: datos.canalId,
    medio: datos.medio,
    comentario: datos.comentario.trim() || null,
    renglones: datos.renglones.map(renglonParaLaBase),
  };
}
