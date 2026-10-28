import { z } from 'zod';
import { proximoPago } from './fijos';
import { centavosDeMonto, montoParaEditar } from './plata';
import { esFechaValida, type Frecuencia } from './vencimientos';

export const MEDIOS_DE_PAGO = ['efectivo_caja', 'transferencia', 'tarjeta', 'otro'] as const;
export const FRECUENCIAS = ['mensual', 'bimestral', 'anual'] as const;
/** "¿Se repite?" del formulario de carga: no, o cada cuánto. */
export const REPETICIONES = ['no', ...FRECUENCIAS] as const;

const NO_FUTURO = 'Un gasto que todavía no pagaste no se carga. Si se repite, elegí cada cuánto.';

const texto = (maximo: number) => z.string().trim().max(maximo, `Usá hasta ${maximo} caracteres.`);
const fecha = z.string().refine(esFechaValida, 'Elegí una fecha válida.');
const proveedorId = z.union([z.literal(''), z.uuid('Elegí un proveedor de la lista.')]);

const camposDeGasto = {
  categoriaId: z.uuid('Elegí una categoría.'),
  monto: z
    .string()
    .refine(
      (escrito) => centavosDeMonto(escrito) !== undefined,
      'Escribí el monto en pesos, con coma para los centavos: 12.345,50.',
    ),
  descripcion: texto(200),
  proveedorId,
  medioDePago: z.enum(MEDIOS_DE_PAGO, 'Elegí cómo se pagó.'),
};

export const esquemaGasto = z.object({
  fecha,
  ...camposDeGasto,
  comprobante: texto(60),
  // Una clave por formulario abierto: guardar dos veces el mismo gasto no lo duplica.
  clave: z.uuid().optional(),
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
export const esquemaClasificacion = z.object({
  id: z.uuid(),
  categoriaId: z.uuid('Elegí una categoría.'),
  proveedorId,
});

const hastaHoy = (hoy: string) => (datos: { fecha: string }) => datos.fecha <= hoy;

/** Cargar: un gasto suelto, con fecha hasta hoy, o un fijo, que puede empezar más adelante. */
export const esquemaCarga = (hoy: string) =>
  esquemaGasto
    .extend({ seRepite: z.enum(REPETICIONES, 'Elegí si se repite.') })
    .refine((datos) => datos.seRepite !== 'no' || hastaHoy(hoy)(datos), {
      path: ['fecha'],
      message: NO_FUTURO,
    });

/** Editar un gasto: sin fecha futura. Con id, para la acción del servidor. */
export const esquemaDeGasto = (hoy: string) =>
  esquemaGasto.refine(hastaHoy(hoy), { path: ['fecha'], message: NO_FUTURO });
export const esquemaDeGastoEditado = (hoy: string) =>
  esquemaGasto
    .extend(esquemaId.shape)
    .refine(hastaHoy(hoy), { path: ['fecha'], message: NO_FUTURO });

/** Editar un fijo: el próximo pago es desde mañana; lo de hoy ya se cargó. */
export const esquemaFijo = (hoy: string) =>
  z.object({
    ...camposDeGasto,
    frecuencia: z.enum(FRECUENCIAS, 'Elegí cada cuánto se repite.'),
    proximoPago: fecha.refine((dia) => dia > hoy, 'El próximo pago tiene que ser después de hoy.'),
  });

export type DatosDeGasto = z.infer<typeof esquemaGasto>;
export type DatosDeCarga = z.infer<ReturnType<typeof esquemaCarga>>;
export type DatosDeFijo = z.infer<ReturnType<typeof esquemaFijo>>;
export type DatosDeClasificacion = z.infer<typeof esquemaClasificacion>;
export type DatosDeCategoria = z.infer<typeof esquemaCategoria>;
export type MedioDePago = (typeof MEDIOS_DE_PAGO)[number];
export type Repeticion = (typeof REPETICIONES)[number];

const vacioANulo = (escrito: string) => (escrito.trim() === '' ? null : escrito.trim());

type Campos = Pick<
  DatosDeGasto,
  'categoriaId' | 'monto' | 'descripcion' | 'proveedorId' | 'medioDePago'
>;

function camposParaLaBase(datos: Campos) {
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

/** Un fijo nuevo: se repite desde la fecha de la carga, con la clave del formulario. */
export function recurrenteParaLaBase(datos: DatosDeCarga) {
  return {
    ...camposParaLaBase(datos),
    frecuencia: datos.seRepite as Frecuencia,
    primer_vencimiento: datos.fecha,
    clave: datos.clave ?? null,
  };
}

/** Un fijo editado: la fecha y la frecuencia viajan solo si cambian, así un 31 sigue en 31. */
export function fijoParaLaBase(datos: DatosDeFijo, conSerie: boolean) {
  const campos = camposParaLaBase(datos);
  if (!conSerie) return campos;
  return { ...campos, frecuencia: datos.frecuencia, primer_vencimiento: datos.proximoPago };
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

export function datosDeFijoParaEditar(
  fila: FilaParaEditar & {
    frecuencia: Frecuencia;
    primer_vencimiento: string;
    generar_desde: string | null;
  },
  hoy: string,
): DatosDeFijo {
  return {
    ...camposParaEditar(fila),
    frecuencia: fila.frecuencia,
    proximoPago: proximoPago(fila, hoy),
  };
}
