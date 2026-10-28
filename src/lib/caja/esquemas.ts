import { z } from 'zod';
import { centavosDeMonto } from '../gastos/plata';
import { esFechaValida } from '../gastos/vencimientos';

/** Un monto de la caja: vacio o cero valen cero (un medio sin ventas); undefined si no se entiende. */
export function centavosDeCaja(texto: string): number | undefined {
  const limpio = texto.trim();
  if (limpio === '' || /^0+(,0{1,2})?$/.test(limpio)) return 0;
  return centavosDeMonto(limpio);
}

const MAL_ESCRITO = 'Escribí el monto en pesos, con coma para los centavos: 12.345,50.';
const seEntiende = (texto: string) => centavosDeCaja(texto) !== undefined;

// Un medio sin ventas se deja vacio.
const montoOpcional = z.string().refine(seEntiende, MAL_ESCRITO);
const montoPedido = (falta: string) =>
  z.string().trim().min(1, falta).refine(seEntiende, MAL_ESCRITO);
const montoMayorQueCero = z
  .string()
  .refine((texto) => centavosDeMonto(texto) !== undefined, MAL_ESCRITO);

export const esquemaCierre = z.object({
  fecha: z.string().refine(esFechaValida, 'Elegí una fecha válida.'),
  fondoInicial: montoPedido('Escribí con cuánto arrancó la caja.'),
  efectivo: montoPedido('Escribí cuánto efectivo hay en la caja.'),
  credito: montoOpcional,
  debito: montoOpcional,
  qr: montoOpcional,
  transferencia: montoOpcional,
  quedaEnCaja: montoPedido('Escribí con cuánto queda la caja.'),
  comentario: z.string().trim().max(500, 'Usá hasta 500 caracteres.'),
  retiros: z.array(
    z.object({
      monto: montoMayorQueCero,
      quien: z.string().trim().min(1, 'Escribí quién retiró.').max(80, 'Usá hasta 80 caracteres.'),
    }),
  ),
  gastos: z.array(
    z.object({
      monto: montoMayorQueCero,
      descripcion: z
        .string()
        .trim()
        .min(1, 'Escribí en qué se gastó.')
        .max(200, 'Usá hasta 200 caracteres.'),
    }),
  ),
});

export const esquemaAnulacionDeCierre = z.object({
  id: z.uuid(),
  motivo: z.string().trim().min(1, 'Escribí el motivo.').max(300, 'Usá hasta 300 caracteres.'),
});
export const esquemaTolerancia = z.object({ tolerancia: montoPedido('Escribí la tolerancia.') });

/** Editar un cierre: lo mismo que cargarlo, con el cierre que se cambia. */
export const esquemaEdicion = esquemaCierre.extend({ id: z.uuid() });

export type DatosDeCierre = z.infer<typeof esquemaCierre>;

const centavos = (texto: string) => centavosDeCaja(texto)!;

/** Lo que recibe la funcion de la base: sin local ni autor, que salen de la sesion. */
export function cierreParaLaBase(datos: DatosDeCierre) {
  return {
    fecha: datos.fecha,
    fondo_inicial_centavos: centavos(datos.fondoInicial),
    efectivo_centavos: centavos(datos.efectivo),
    credito_centavos: centavos(datos.credito),
    debito_centavos: centavos(datos.debito),
    qr_centavos: centavos(datos.qr),
    transferencia_centavos: centavos(datos.transferencia),
    queda_en_caja_centavos: centavos(datos.quedaEnCaja),
    comentario: datos.comentario.trim() || null,
    ...salidasParaLaBase(datos),
  };
}

// Lo que salio de la caja en el dia: retiros y gastos pagados con ella.
function salidasParaLaBase({ retiros, gastos }: DatosDeCierre) {
  return {
    retiros: retiros.map((r) => ({ monto_centavos: centavos(r.monto), quien: r.quien.trim() })),
    gastos: gastos.map((g) => ({
      monto_centavos: centavos(g.monto),
      descripcion: g.descripcion.trim(),
    })),
  };
}
