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

const MEDIDA = 'Escribí cuántas son, en un número entero mayor que cero.';

export const esquemaPresentacion = z
  .object({
    id: z.string(),
    nombre: nombre(50),
    compartido: pesos,
    // Lo que tenia al abrir el formulario: si no cambio, no se manda.
    compartidoOriginal: z.string(),
    // Cuánto es la forma de venta: unidades (Docena = 12) o gramos (Por cuarto = 250).
    medida: z.enum(['', 'unidades', 'gramos']).optional(),
    cantidad: z.string().trim().optional(),
  })
  .refine((p) => !p.medida || /^[1-9]\d{0,5}$/.test(p.cantidad ?? ''), {
    message: MEDIDA,
    path: ['cantidad'],
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
    .min(1, 'Agregá al menos una forma de venta.')
    .max(6, 'Usá hasta 6 formas de venta.'),
});

export const esquemaProducto = z.object({
  id: z.string(),
  categoriaId: z.uuid('Elegí una categoría.'),
  nombre: nombre(100),
  descripcion: z.string().trim().max(300, 'Usá hasta 300 caracteres.'),
  etiqueta: z.enum(['', 'mas_vendido', 'artesanal', 'nuevo']),
  visible: z.boolean(),
  precios: z.array(z.object({ presentacionId: z.uuid(), monto: pesos, original: z.string() })),
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

type Presentacion = DatosDeCategoria['presentaciones'][number];

// Solo los compartidos que cambiaron: un precio que nadie toco no pisa un aumento hecho en el
// medio. Sin la casilla de precio compartido, el nuevo es ninguno.
// Sin el campo de la medida (un llamado viejo) no se tocan; con él, va una y la otra en nulo.
function medidaParaLaBase(p: Presentacion) {
  if (p.medida === undefined) return {};
  const cantidad = p.medida ? Number(p.cantidad) : null;
  return {
    unidades: p.medida === 'unidades' ? cantidad : null,
    gramos: p.medida === 'gramos' ? cantidad : null,
  };
}

function presentacionParaLaBase(p: Presentacion, conCompartido: boolean) {
  const base = { id: vacioANulo(p.id), nombre: p.nombre.trim(), ...medidaParaLaBase(p) };
  const nuevo = conCompartido ? aCentavos(p.compartido) : null;
  if (nuevo === aCentavos(p.compartidoOriginal)) return base;
  return { ...base, monto_compartido_centavos: nuevo };
}

/** Lo que recibe menu_guardar_categoria. */
export function categoriaParaLaBase(datos: DatosDeCategoria) {
  return {
    id: vacioANulo(datos.id),
    nombre: datos.nombre.trim(),
    subtitulo: vacioANulo(datos.subtitulo),
    icono: datos.icono,
    foto: vacioANulo(datos.foto),
    presentaciones: datos.presentaciones.map((p) =>
      presentacionParaLaBase(p, datos.precioCompartido),
    ),
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
    precios: datos.precios
      .filter((p) => aCentavos(p.monto) !== aCentavos(p.original))
      .map((p) => ({ presentacion_id: p.presentacionId, monto_centavos: aCentavos(p.monto) })),
  };
}
