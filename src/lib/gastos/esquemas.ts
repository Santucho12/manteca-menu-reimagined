import { z } from 'zod';
import { centavosDeMonto, montoParaEditar } from './plata';
import { esFechaValida } from './vencimientos';

export const MEDIOS_DE_PAGO = ['efectivo_caja', 'transferencia', 'tarjeta', 'otro'] as const;
export const FRECUENCIAS = ['mensual', 'bimestral', 'anual'] as const;

const texto = (maximo: number) => z.string().trim().max(maximo, `Usá hasta ${maximo} caracteres.`);
const fecha = z.string().refine(esFechaValida, 'Elegí una fecha válida.');

const camposDeGasto = {
  categoriaId: z.uuid('Elegí una categoría.'),
  monto: z
    .string()
    .refine(
      (escrito) => centavosDeMonto(escrito) !== undefined,
      'Escribí el monto en pesos, con coma para los centavos: 12.345,50.',
    ),
  descripcion: texto(200),
  proveedorId: z.union([z.literal(''), z.uuid('Elegí un proveedor de la lista.')]),
  medioDePago: z.enum(MEDIOS_DE_PAGO, 'Elegí cómo se pagó.'),
};

export const esquemaGasto = z.object({ fecha, ...camposDeGasto, comprobante: texto(60) });
export const esquemaRecurrente = z.object({
  ...camposDeGasto,
  frecuencia: z.enum(FRECUENCIAS, 'Elegí cada cuánto se repite.'),
  primerVencimiento: fecha,
});
export const esquemaAnulacion = z.object({
  id: z.uuid(),
  motivo: z.string().trim().min(1, 'Escribí el motivo.').max(300, 'Usá hasta 300 caracteres.'),
});
export const esquemaCategoria = z.object({
  nombre: z.string().trim().min(1, 'Escribí el nombre.').max(60, 'Usá hasta 60 caracteres.'),
  pideProveedor: z.boolean(),
});
export const esquemaId = z.object({ id: z.uuid() });

export type DatosDeGasto = z.infer<typeof esquemaGasto>;
export type DatosDeRecurrente = z.infer<typeof esquemaRecurrente>;
export type DatosDeCategoria = z.infer<typeof esquemaCategoria>;
export type MedioDePago = (typeof MEDIOS_DE_PAGO)[number];

const vacioANulo = (escrito: string) => (escrito.trim() === '' ? null : escrito.trim());

function camposParaLaBase(datos: DatosDeGasto | DatosDeRecurrente) {
  return {
    categoria_id: datos.categoriaId,
    monto_centavos: centavosDeMonto(datos.monto)!,
    descripcion: vacioANulo(datos.descripcion),
    proveedor_id: datos.proveedorId || null,
    medio_de_pago: datos.medioDePago,
  };
}

/** La fila que se guarda: sin local ni autor, que los pone la base con la sesion. */
export function gastoParaLaBase(datos: DatosDeGasto) {
  return {
    fecha: datos.fecha,
    ...camposParaLaBase(datos),
    comprobante: vacioANulo(datos.comprobante),
  };
}

export function recurrenteParaLaBase(datos: DatosDeRecurrente) {
  return {
    ...camposParaLaBase(datos),
    frecuencia: datos.frecuencia,
    primer_vencimiento: datos.primerVencimiento,
  };
}

type FilaParaEditar = {
  categoria_id: string;
  monto_centavos: number;
  descripcion: string | null;
  proveedor_id: string | null;
  medio_de_pago: MedioDePago;
};

function camposParaEditar(fila: FilaParaEditar) {
  return {
    categoriaId: fila.categoria_id,
    monto: montoParaEditar(fila.monto_centavos),
    descripcion: fila.descripcion ?? '',
    proveedorId: fila.proveedor_id ?? '',
    medioDePago: fila.medio_de_pago,
  };
}

export function datosDeGastoParaEditar(
  fila: FilaParaEditar & { fecha: string; comprobante: string | null },
): DatosDeGasto {
  return { fecha: fila.fecha, ...camposParaEditar(fila), comprobante: fila.comprobante ?? '' };
}

export function datosDeRecurrenteParaEditar(
  fila: FilaParaEditar & {
    frecuencia: DatosDeRecurrente['frecuencia'];
    primer_vencimiento: string;
  },
): DatosDeRecurrente {
  return {
    ...camposParaEditar(fila),
    frecuencia: fila.frecuencia,
    primerVencimiento: fila.primer_vencimiento,
  };
}
