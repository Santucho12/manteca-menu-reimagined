import { z } from 'zod';
import { formatearPesosEnteros } from '../plata';

const esquemaFila = z.object({
  categoria_id: z.string(),
  categoria: z.string(),
  subtitulo: z.string().nullable(),
  foto: z.string().nullable(),
  icono: z.string(),
  orden_categoria: z.number(),
  compartidos: z.array(z.object({ presentacion: z.string(), monto_centavos: z.number() })),
  producto_id: z.string(),
  nombre: z.string(),
  descripcion: z.string().nullable(),
  etiqueta: z.enum(['mas_vendido', 'artesanal', 'nuevo']).nullable(),
  orden: z.number(),
  precios: z.array(
    z.object({
      presentacion: z.string(),
      monto_centavos: z.number().nullable(),
      compartido: z.boolean(),
    }),
  ),
});

export type FilaPublica = z.infer<typeof esquemaFila>;
export type PrecioPublico = { etiqueta: string | null; texto: string };
export type ProductoPublico = {
  id: string;
  nombre: string;
  descripcion: string | null;
  etiqueta: string | null;
  precios: PrecioPublico[];
};
export type CategoriaPublica = {
  id: string;
  ancla: string;
  nombre: string;
  icono: string;
  foto: string | null;
  subtitulo: string | null;
  columnas: 1 | 2;
  encabezados: string[] | null;
  productos: ProductoPublico[];
};

export const TEXTOS_DE_ETIQUETA = {
  mas_vendido: '🔥 Más vendido',
  artesanal: 'Artesanal',
  nuevo: 'Nuevo',
} as const;

/** Las filas de menu_publico, comprobadas: los JSON de la vista llegan sin tipo. */
export function leerFilas(datos: unknown): FilaPublica[] {
  return z.array(esquemaFila).parse(datos);
}

const textoDe = (monto: number | null) => (monto === null ? '—' : formatearPesosEnteros(monto));

function subtituloDe(fila: FilaPublica): string | null {
  const precios = fila.compartidos.map(
    (c) => `${c.presentacion} ${formatearPesosEnteros(c.monto_centavos)}`,
  );
  const partes = [...precios, ...(fila.subtitulo ? [fila.subtitulo] : [])];
  return partes.length > 0 ? partes.join(' · ') : null;
}

// Una columna por presentacion cuando hay varias y ninguna tiene precio compartido.
function encabezadosDe(fila: FilaPublica): string[] | null {
  if (fila.precios.length < 2 || fila.compartidos.length > 0) return null;
  return fila.precios.map((p) => p.presentacion);
}

function preciosDe(fila: FilaPublica, encabezados: string[] | null): PrecioPublico[] {
  if (encabezados)
    return fila.precios.map((p) => ({
      etiqueta: p.presentacion,
      texto: textoDe(p.monto_centavos),
    }));
  // El heredado ya esta en el subtitulo: el producto muestra solo los suyos.
  const propios = fila.precios.filter((p) => !p.compartido && p.monto_centavos !== null);
  const conEtiqueta = fila.precios.length > 1;
  return propios.map((p) => ({
    etiqueta: conEtiqueta ? p.presentacion : null,
    texto: textoDe(p.monto_centavos),
  }));
}

function productoDe(fila: FilaPublica, encabezados: string[] | null): ProductoPublico {
  return {
    id: fila.producto_id,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    etiqueta: fila.etiqueta ? TEXTOS_DE_ETIQUETA[fila.etiqueta] : null,
    precios: preciosDe(fila, encabezados),
  };
}

function anclaDe(nombre: string, usadas: Set<string>): string {
  const base =
    nombre
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'categoria';
  let ancla = base;
  for (let n = 2; usadas.has(ancla); n += 1) ancla = `${base}-${n}`;
  usadas.add(ancla);
  return ancla;
}

type Grupo = [FilaPublica, ...FilaPublica[]];

function categoriaDe(filas: Grupo, usadas: Set<string>): CategoriaPublica {
  const [primera] = filas;
  const encabezados = encabezadosDe(primera);
  return {
    id: primera.categoria_id,
    ancla: anclaDe(primera.categoria, usadas),
    nombre: primera.categoria,
    icono: primera.icono,
    foto: primera.foto,
    subtitulo: subtituloDe(primera),
    columnas: encabezados ? 1 : 2,
    encabezados,
    productos: filas.map((fila) => productoDe(fila, encabezados)),
  };
}

const enOrden = (a: FilaPublica, b: FilaPublica) =>
  a.orden_categoria - b.orden_categoria ||
  a.categoria_id.localeCompare(b.categoria_id) ||
  a.orden - b.orden ||
  a.producto_id.localeCompare(b.producto_id);

/** El menu agrupado por categoria, en el orden que eligio el admin. */
export function menuPublico(filas: FilaPublica[]): CategoriaPublica[] {
  const grupos = new Map<string, Grupo>();
  for (const fila of [...filas].sort(enOrden)) {
    const grupo = grupos.get(fila.categoria_id);
    if (grupo) grupo.push(fila);
    else grupos.set(fila.categoria_id, [fila]);
  }
  const usadas = new Set<string>();
  return [...grupos.values()].map((grupo) => categoriaDe(grupo, usadas));
}
