import { exito, fallo, type Resultado } from '../resultado';
import type { Cliente } from '../supabase/cliente';
import type { Json } from '../supabase/tipos';
import {
  compraParaLaBase,
  desdeGastoParaLaBase,
  pedidoParaLaBase,
  type DatosDeCompra,
  type DatosDePedido,
  type DatosDesdeGasto,
} from './esquemas';

export const MENSAJES_DE_COMPRAS: Record<string, string> = {
  '42501': 'No tenés permiso para hacer esto.',
  PU300: 'No tenés permiso para hacer esto.',
  PU301: 'Ese proveedor ya no está disponible. Recargá la página.',
  PU302: 'La fecha de la compra no puede ser futura.',
  PU303: 'Agregá al menos un renglón.',
  PU304: 'Un renglón no es de este proveedor o ya no está disponible. Revisalo.',
  PU305: 'La compra no puede ser de $0.',
  PU306: 'Ese pedido ya se recibió o se anuló. Recargá la página.',
  PU307: 'Los renglones pasan el monto que salió de la caja.',
  PU308: 'Esa compra ya no está disponible. Recargá la página.',
  PU309: 'Escribí el motivo.',
  PU310: 'Cada renglón lleva una cantidad.',
  PU312: 'Ese gasto ya no está para clasificar. Recargá la página.',
  PG207: 'El efectivo de la caja sale por el cierre del día: elegí otro medio.',
  PG210: 'Lo por pagar de esta compra ya se pagó: anulá primero el pago, en Gastos.',
};
const GENERICO = 'No pudimos guardarla. Revisá los datos e intentá de nuevo.';
const mensajeDe = (error: { code?: string | null }) =>
  MENSAJES_DE_COMPRAS[error.code ?? ''] ?? GENERICO;

type Respuesta = { data: unknown; error: { code?: string } | null };

function resultadoDe(respuesta: Respuesta): Resultado<{ id: string }> {
  return respuesta.error
    ? fallo(mensajeDe(respuesta.error))
    : exito({ id: respuesta.data as string });
}

/** Recibe un pedido o carga una compra directa; la clave hace que el doble envio no duplique. */
export async function recibirCompra(cliente: Cliente, datos: DatosDeCompra, clave: string) {
  const datosDeLaBase = compraParaLaBase(datos, clave) as Json;
  return resultadoDe(await cliente.rpc('compras_recibir', { datos: datosDeLaBase }));
}

export async function pedirCompra(cliente: Cliente, datos: DatosDePedido, clave: string) {
  return resultadoDe(
    await cliente.rpc('compras_pedir', { datos: pedidoParaLaBase(datos, clave) as Json }),
  );
}

export async function compraDesdeGasto(cliente: Cliente, datos: DatosDesdeGasto, clave: string) {
  const datosDeLaBase = desdeGastoParaLaBase(datos, clave) as Json;
  return resultadoDe(await cliente.rpc('compras_desde_gasto', { datos: datosDeLaBase }));
}

export async function anularCompra(
  cliente: Cliente,
  id: string,
  motivo: string,
): Promise<Resultado> {
  const { error } = await cliente.rpc('compras_anular', { la_compra: id, motivo });
  return error ? fallo(mensajeDe(error)) : exito(undefined);
}
