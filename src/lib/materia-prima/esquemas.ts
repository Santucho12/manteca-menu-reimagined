import { z } from 'zod';
import { centavosDeMonto, montoParaEditar } from '../gastos/plata';

export const UNIDADES_DE_USO = ['g', 'ml', 'unidad'] as const;

// Miles con punto bien agrupados (o sin puntos) y hasta tres decimales con coma, como un monto.
const FORMA_DEL_CONTENIDO = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,3}))?$/;
const MAXIMO_DE_DIGITOS = 11;

const texto = (maximo: number) => z.string().trim().max(maximo, `Usá hasta ${maximo} caracteres.`);
const obligatorio = (maximo: number, falta: string) => texto(maximo).min(1, falta);

/** Lee el contenido escrito a mano (25.000 o 1,5); undefined si no se entiende o es cero. */
export function contenidoDeTexto(escrito: string): number | undefined {
  const partes = FORMA_DEL_CONTENIDO.exec(escrito.trim());
  if (!partes) return undefined;
  const entero = partes[1]!.replaceAll('.', '');
  if (entero.length > MAXIMO_DE_DIGITOS) return undefined;
  const valor = Number(`${entero}.${partes[2] ?? '0'}`);
  return valor > 0 ? valor : undefined;
}

/** El contenido como se escribe en el formulario: 25.000, o 1.500,5. */
export function contenidoParaEditar(contenido: number): string {
  const [entero, decimales] = contenido.toFixed(3).split('.');
  const conMiles = entero!.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const resto = decimales!.replace(/0+$/, '');
  return resto ? `${conMiles},${resto}` : conMiles;
}

export const esquemaInsumo = z.object({
  nombre: obligatorio(100, 'Escribí el nombre.'),
  unidad: z.enum(UNIDADES_DE_USO, 'Elegí en qué se mide.'),
  observaciones: texto(500),
});

export const esquemaFormaDeCompra = z.object({
  proveedorId: z.union([z.literal(''), z.uuid('Elegí un proveedor de la lista.')]),
  comoSeCompra: obligatorio(100, 'Escribí cómo se compra, por ejemplo Bolsa de 25 kg.'),
  contenido: z
    .string()
    .refine(
      (escrito) => contenidoDeTexto(escrito) !== undefined,
      'Escribí cuánto trae, con coma para los decimales: 25.000 o 1,5.',
    ),
  precio: z
    .string()
    .refine(
      (escrito) => escrito.trim() === '' || centavosDeMonto(escrito) !== undefined,
      'Escribí el precio en pesos, con coma para los centavos: 32.000 o 1.250,50.',
    ),
});

export const esquemaIdDeInsumo = z.object({ id: z.uuid() });

export type DatosDeInsumo = z.infer<typeof esquemaInsumo>;
export type DatosDeFormaDeCompra = z.infer<typeof esquemaFormaDeCompra>;

const vacioANulo = (escrito: string) => (escrito.trim() === '' ? null : escrito.trim());

/** La fila del insumo que se guarda: sin local, que lo pone la base con la sesion. */
export function insumoParaLaBase(datos: DatosDeInsumo) {
  return {
    nombre: datos.nombre.trim(),
    unidad_de_uso: datos.unidad,
    observaciones: vacioANulo(datos.observaciones),
  };
}

/** La fila de la forma de compra que se guarda, con el precio en centavos. */
export function formaParaLaBase(datos: DatosDeFormaDeCompra) {
  return {
    proveedor_id: datos.proveedorId === '' ? null : datos.proveedorId,
    como_se_compra: datos.comoSeCompra.trim(),
    contenido: contenidoDeTexto(datos.contenido)!,
    precio_referencia_centavos: centavosDeMonto(datos.precio) ?? null,
  };
}

type FormaGuardada = {
  proveedor_id: string | null;
  como_se_compra: string;
  contenido: number;
  precio_referencia_centavos: number | null;
};

/** El formulario de edicion de una forma, con el contenido y el precio como se escriben. */
export function datosDeFormaParaEditar(forma: FormaGuardada): DatosDeFormaDeCompra {
  return {
    proveedorId: forma.proveedor_id ?? '',
    comoSeCompra: forma.como_se_compra,
    contenido: contenidoParaEditar(forma.contenido),
    precio:
      forma.precio_referencia_centavos === null
        ? ''
        : montoParaEditar(forma.precio_referencia_centavos),
  };
}
