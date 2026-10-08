import { z } from 'zod';
import { PORCENTAJE_MAXIMO, PORCENTAJE_MINIMO } from './aumento';
import { ICONOS } from './iconos';

// Los precios se escriben en pesos enteros; vacio es "sin precio".
const pesos = z
  .string()
  .trim()
  .regex(/^\d{0,7}$/, 'Escribí el precio en pesos, sin puntos ni centavos.')
  .refine((texto) => texto === '' || Number(texto) > 0, 'El precio tiene que ser mayor que cero.');

const nombre = (maximo: number) =>
  z.string().trim().min(1, 'Escribí el nombre.').max(maximo, `Usá hasta ${maximo} caracteres.`);

export const esquemaPresentacion = z.object({
  id: z.string(),
  nombre: nombre(50),
  compartido: pesos,
});

export const esquemaCategoria = z.object({
  id: z.string(),
  nombre: nombre(100),
  subtitulo: z.string().trim().max(100, 'Usá hasta 100 caracteres.'),
  icono: z.enum(ICONOS),
  foto: z.string().max(300),
  precioCompartido: z.boolean(),
  presentaciones: z
    .array(esquemaPresentacion)
    .min(1, 'Tiene que tener al menos una presentación.')
    .max(6, 'Usá hasta 6 presentaciones.'),
});

export const esquemaProducto = z.object({
  id: z.string(),
  categoriaId: z.uuid('Elegí una categoría.'),
  nombre: nombre(100),
  descripcion: z.string().trim().max(300, 'Usá hasta 300 caracteres.'),
  etiqueta: z.enum(['', 'mas_vendido', 'artesanal', 'nuevo']),
  visible: z.boolean(),
  precios: z.array(z.object({ presentacionId: z.uuid(), monto: pesos })),
});

const porcentaje = z
  .string()
  .trim()
  .regex(/^-?\d{1,3}$/, 'Escribí un número entero, como 10 o -5.')
  .refine((texto) => {
    const valor = Number(texto);
    return valor !== 0 && valor >= PORCENTAJE_MINIMO && valor <= PORCENTAJE_MAXIMO;
  }, 'El porcentaje va de -50 a 200, y no puede ser 0.');

export const esquemaAumento = z.object({
  categoriaId: z.string(),
  porcentaje,
  redondeo: z.enum(['1000', '5000', '10000', '50000']),
});

export const esquemaAplicarAumento = esquemaAumento.extend({
  precios: z.array(z.object({ id: z.uuid(), antesCentavos: z.number().int().positive() })).min(1),
});

export const esquemaElemento = z.object({ tipo: z.enum(['categoria', 'producto']), id: z.uuid() });
export const esquemaVisibilidad = esquemaElemento.extend({ mostrar: z.boolean() });
export const esquemaMover = esquemaElemento.extend({ direccion: z.enum(['arriba', 'abajo']) });

export type DatosDeCategoria = z.infer<typeof esquemaCategoria>;
export type DatosDeProducto = z.infer<typeof esquemaProducto>;
export type DatosDeAumento = z.infer<typeof esquemaAumento>;
export type DatosDeAplicarAumento = z.infer<typeof esquemaAplicarAumento>;
export type ElementoDelMenu = z.infer<typeof esquemaElemento>;

export function aCentavos(texto: string): number | null {
  const limpio = texto.trim();
  return limpio === '' ? null : Number(limpio) * 100;
}

const vacioANulo = (texto: string) => (texto.trim() === '' ? null : texto.trim());

/** Lo que recibe menu_guardar_categoria. */
export function categoriaParaLaBase(datos: DatosDeCategoria) {
  return {
    id: vacioANulo(datos.id),
    nombre: datos.nombre.trim(),
    subtitulo: vacioANulo(datos.subtitulo),
    icono: datos.icono,
    foto: vacioANulo(datos.foto),
    presentaciones: datos.presentaciones.map((p) => ({
      id: vacioANulo(p.id),
      nombre: p.nombre.trim(),
      monto_compartido_centavos: datos.precioCompartido ? aCentavos(p.compartido) : null,
    })),
  };
}

/** Lo que recibe menu_guardar_producto. */
export function productoParaLaBase(datos: DatosDeProducto) {
  return {
    id: vacioANulo(datos.id),
    categoria_id: datos.categoriaId,
    nombre: datos.nombre.trim(),
    descripcion: vacioANulo(datos.descripcion),
    etiqueta: vacioANulo(datos.etiqueta),
    visible: datos.visible,
    precios: datos.precios.map((p) => ({
      presentacion_id: p.presentacionId,
      monto_centavos: aCentavos(p.monto),
    })),
  };
}
