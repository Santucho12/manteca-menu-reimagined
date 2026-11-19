import { z } from 'zod';
import { centavosDeMonto } from '../gastos/plata';
import { contenidoDeTexto } from '../materia-prima/esquemas';

const CANTIDAD = 'Escribí la cantidad, con coma para los decimales: 250 o 1,5.';
const positivo = (mensaje: string) =>
  z.string().refine((escrito) => contenidoDeTexto(escrito) !== undefined, mensaje);
// El desperdicio puede ser cero: contenidoDeTexto solo acepta mas de cero.
const desperdicioDe = (escrito: string) =>
  escrito.trim() === '0' || escrito.trim() === '' ? 0 : contenidoDeTexto(escrito);

export const esquemaReceta = z.object({
  productoId: z.uuid(),
  presentacionId: z.union([z.literal(''), z.uuid()]),
  rinde: positivo('Escribí cuánto rinde, por ejemplo 40.'),
  desperdicio: z.string().refine((escrito) => {
    const valor = desperdicioDe(escrito);
    return valor !== undefined && valor <= 50;
  }, 'El desperdicio va de 0 a 50 %.'),
  renglones: z
    .array(
      z.object({ insumoId: z.uuid('Elegí un insumo de la lista.'), cantidad: positivo(CANTIDAD) }),
    )
    .min(1, 'Agregá al menos un insumo.'),
});

export const esquemaMargenes = z
  .object({
    objetivo: z.number().int().min(1, 'Va de 1 a 95 %.').max(95, 'Va de 1 a 95 %.'),
    minimo: z.number().int().min(0, 'Va de 0 a 95 %.').max(95, 'Va de 0 a 95 %.'),
  })
  .refine((m) => m.minimo <= m.objetivo, {
    path: ['minimo'],
    message: 'El mínimo no puede ser más que el objetivo.',
  });

export const esquemaUnidades = z.object({
  unidades: positivo('Escribí cuántas unidades lleva, por ejemplo 12.'),
  agregado: z
    .string()
    .refine(
      (escrito) => escrito.trim() === '' || centavosDeMonto(escrito) !== undefined,
      'Escribí el monto en pesos, con coma para los centavos: 500 o 1.250,50.',
    ),
});

export type DatosDeReceta = z.infer<typeof esquemaReceta>;
export type DatosDeMargenes = z.infer<typeof esquemaMargenes>;
export type DatosDeUnidades = z.infer<typeof esquemaUnidades>;

/** Lo que recibe recetas_guardar: los numeros ya leidos. */
export function recetaParaLaBase(datos: DatosDeReceta) {
  return {
    producto_id: datos.productoId,
    presentacion_id: datos.presentacionId === '' ? null : datos.presentacionId,
    rinde: contenidoDeTexto(datos.rinde)!,
    desperdicio_porcentaje: desperdicioDe(datos.desperdicio)!,
    renglones: datos.renglones.map((renglon) => ({
      insumo_id: renglon.insumoId,
      cantidad: contenidoDeTexto(renglon.cantidad)!,
    })),
  };
}

export function unidadesParaLaBase(datos: DatosDeUnidades) {
  return {
    unidades: contenidoDeTexto(datos.unidades)!,
    agregado_centavos: centavosDeMonto(datos.agregado) ?? 0,
  };
}
