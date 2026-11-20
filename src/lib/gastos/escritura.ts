import { exito, fallo, type Resultado } from '../resultado';
import type { Cliente } from '../supabase/cliente';
import { recurrentePorId } from './consultas';
import {
  fijoParaLaBase,
  gastoParaLaBase,
  MENSAJE_DE_REPETIDO,
  porPagarParaLaBase,
  quedaPorPagar,
  recurrenteParaLaBase,
  type DatosDeCarga,
  type DatosDeCategoria,
  type DatosDeClasificacion,
  type DatosDeFijo,
  type DatosDeGasto,
  type MedioDePago,
} from './esquemas';
import { cambiaLaSerie } from './fijos';

export const MENSAJES_DE_GASTOS = {
  sinPermiso: 'No tenés permiso para hacer esto.',
  noDisponible: 'Eso ya no está disponible. Recargá la página.',
  categoriaNoDisponible: 'Esa categoría ya no está disponible. Elegí otra.',
  pideProveedor: 'Esta categoría pide un proveedor. Elegilo de la lista.',
  proveedorNoDisponible: 'Ese proveedor está desactivado. Elegí otro.',
  anulado: 'Este gasto está anulado y ya no se puede cambiar.',
  sinMotivo: 'Escribí el motivo de la anulación.',
  deSistema: '"Sin clasificar" no se puede renombrar ni desactivar.',
  categoriaRepetida: 'Ya hay una categoría con ese nombre.',
  deCierre:
    'Este gasto salió de un cierre de caja: el monto, la fecha y el medio de pago se corrigen anulando el cierre.',
  anularDeCierre: 'Este gasto salió de un cierre de caja: se anula anulando el cierre.',
  efectivoDeCaja:
    'El efectivo de la caja sale por el cierre del día: que lo cargue quien cierra la caja.',
  proximoPagoPasado: 'El próximo pago tiene que ser después de hoy.',
  yaPagado: 'Ese pago ya estaba anotado.',
  yaNoPorPagar: 'Eso ya no está por pagar. Recargá la página.',
  yaEstaPagado: 'Ya está pagado: si no corresponde, anulá el pago desde Pagados.',
  deUnaCompra: 'Es el gasto de una compra: anulá la compra desde Compras.',
  noEsDelFijo: 'Esa fecha no es un próximo pago del fijo.',
  posibleRepetido: MENSAJE_DE_REPETIDO,
  generico: 'No pudimos guardarlo. Revisá los datos e intentá de nuevo.',
} as const;

const POR_CODIGO: Record<string, string> = {
  '42501': MENSAJES_DE_GASTOS.sinPermiso,
  PG201: MENSAJES_DE_GASTOS.categoriaNoDisponible,
  PG202: MENSAJES_DE_GASTOS.pideProveedor,
  PG203: MENSAJES_DE_GASTOS.proveedorNoDisponible,
  PG204: MENSAJES_DE_GASTOS.anulado,
  PG205: MENSAJES_DE_GASTOS.sinMotivo,
  PG206: MENSAJES_DE_GASTOS.deSistema,
  '23505': MENSAJES_DE_GASTOS.categoriaRepetida,
  PC305: MENSAJES_DE_GASTOS.deCierre,
  PC306: MENSAJES_DE_GASTOS.anularDeCierre,
  PG207: MENSAJES_DE_GASTOS.efectivoDeCaja,
  PG208: MENSAJES_DE_GASTOS.proximoPagoPasado,
  PG209: MENSAJES_DE_GASTOS.yaNoPorPagar,
  PG210: MENSAJES_DE_GASTOS.yaEstaPagado,
  PG211: MENSAJES_DE_GASTOS.noEsDelFijo,
  PG212: MENSAJES_DE_GASTOS.deUnaCompra,
};

type Respuesta = {
  data: { id: string }[] | { id: string } | null;
  error: { code?: string } | null;
};

const mensajeDe = (error: { code?: string }) =>
  POR_CODIGO[error.code ?? ''] ?? MENSAJES_DE_GASTOS.generico;

export function alCrear({ data, error }: Respuesta): Resultado<{ id: string }> {
  if (error) return fallo(mensajeDe(error));
  return exito({ id: (data as { id: string }).id });
}

// RLS no da error si la fila no es del local: se comprueba que haya cambiado una.
export function alCambiar({ data, error }: Respuesta): Resultado {
  if (error) return fallo(mensajeDe(error));
  return (data as { id: string }[]).length === 1
    ? exito(undefined)
    : fallo(MENSAJES_DE_GASTOS.noDisponible);
}

async function gastoDeLaClave(cliente: Cliente, clave: string) {
  return alCrear(await cliente.from('gastos').select('id').eq('clave', clave).single());
}

/** La misma carga mandada dos veces (un toque repetido, un reintento) devuelve el mismo gasto. */
export async function crearGasto(cliente: Cliente, datos: DatosDeGasto) {
  const fila = { ...gastoParaLaBase(datos), clave: datos.clave ?? null };
  const creado = await cliente.from('gastos').insert(fila).select('id').single();
  if (creado.error?.code === '23505' && datos.clave) return gastoDeLaClave(cliente, datos.clave);
  return alCrear(creado);
}

export async function editarGasto(cliente: Cliente, id: string, datos: DatosDeGasto) {
  return alCambiar(
    await cliente.from('gastos').update(gastoParaLaBase(datos)).eq('id', id).select('id'),
  );
}

/** Quien y cuando los anota la base; lo anulado no cuenta en los totales. */
export async function anularGasto(cliente: Cliente, id: string, motivo: string) {
  return alCambiar(
    await cliente
      .from('gastos')
      .update({ anulado: true, motivo_anulacion: motivo })
      .eq('id', id)
      .select('id'),
  );
}

async function recurrenteDeLaClave(cliente: Cliente, clave: string) {
  return alCrear(await cliente.from('gastos_recurrentes').select('id').eq('clave', clave).single());
}

/** Un fijo nuevo; la misma carga mandada dos veces devuelve el mismo fijo. */
export async function crearRecurrente(cliente: Cliente, datos: DatosDeCarga) {
  const creado = await cliente
    .from('gastos_recurrentes')
    .insert(recurrenteParaLaBase(datos))
    .select('id')
    .single();
  if (creado.error?.code === '23505' && datos.clave) {
    return recurrenteDeLaClave(cliente, datos.clave);
  }
  return alCrear(creado);
}

async function porPagarDeLaClave(cliente: Cliente, clave: string) {
  return alCrear(await cliente.from('gastos_por_pagar').select('id').eq('clave', clave).single());
}

/** Algo por pagar; la misma carga mandada dos veces devuelve lo mismo. */
export async function crearPorPagar(cliente: Cliente, datos: DatosDeCarga) {
  const creado = await cliente
    .from('gastos_por_pagar')
    .insert(porPagarParaLaBase(datos))
    .select('id')
    .single();
  if (creado.error?.code === '23505' && datos.clave) return porPagarDeLaClave(cliente, datos.clave);
  return alCrear(creado);
}

export type TipoDeCarga = 'gasto' | 'fijo' | 'porPagar';

function tipoDeCarga(datos: DatosDeCarga): TipoDeCarga {
  if (datos.seRepite !== 'no') return 'fijo';
  return quedaPorPagar(datos) ? 'porPagar' : 'gasto';
}

const CARGAR: Record<TipoDeCarga, typeof crearRecurrente> = {
  fijo: crearRecurrente,
  porPagar: crearPorPagar,
  // Lo pagado trae el medio: el esquema lo exige.
  gasto: (cliente, datos) =>
    crearGasto(cliente, { ...datos, medioDePago: datos.medioDePago as MedioDePago }),
};

/**
 * Otro gasto vigente del mismo proveedor, monto y día. El de la misma clave no cuenta: es el
 * mismo formulario mandado dos veces, y crearGasto devuelve ese gasto.
 */
async function hayOtroIgual(cliente: Cliente, datos: DatosDeCarga): Promise<boolean> {
  const fila = gastoParaLaBase({ ...datos, medioDePago: datos.medioDePago as MedioDePago });
  if (!fila.proveedor_id) return false;
  const consulta = cliente
    .from('gastos')
    .select('id', { count: 'exact', head: true })
    .eq('proveedor_id', fila.proveedor_id)
    .eq('monto_centavos', fila.monto_centavos)
    .eq('fecha', fila.fecha)
    .eq('anulado', false);
  const { count } = await (datos.clave
    ? consulta.or(`clave.is.null,clave.neq.${datos.clave}`)
    : consulta);
  return (count ?? 0) > 0;
}

/** Cargar gasto: pagado, por pagar, o un fijo que deja cada pago por pagar en su fecha. */
export async function cargarGasto(
  cliente: Cliente,
  datos: DatosDeCarga,
): Promise<Resultado<{ id: string; tipo: TipoDeCarga }>> {
  const tipo = tipoDeCarga(datos);
  if (tipo === 'gasto' && !datos.cargarIgual && (await hayOtroIgual(cliente, datos))) {
    return fallo(MENSAJES_DE_GASTOS.posibleRepetido);
  }
  const resultado = await CARGAR[tipo](cliente, datos);
  return resultado.ok ? exito({ id: resultado.datos.id, tipo }) : resultado;
}

/** Editar un fijo: si cambian la fecha o la frecuencia, cuenta desde el próximo pago. */
export async function editarRecurrente(
  cliente: Cliente,
  id: string,
  datos: DatosDeFijo,
  hoy: string,
) {
  const actual = await recurrentePorId(cliente, id);
  if (!actual) return fallo(MENSAJES_DE_GASTOS.noDisponible);
  const fila = fijoParaLaBase(datos, cambiaLaSerie(actual, datos, hoy));
  return alCambiar(await cliente.from('gastos_recurrentes').update(fila).eq('id', id).select('id'));
}

/** Clasificar cambia solo la categoría y el proveedor: el monto de un gasto de caja no se toca. */
export async function clasificarGasto(cliente: Cliente, datos: DatosDeClasificacion) {
  const cambios = { categoria_id: datos.categoriaId, proveedor_id: datos.proveedorId || null };
  return alCambiar(
    await cliente
      .from('gastos')
      .update(cambios)
      .eq('id', datos.id)
      .eq('anulado', false)
      .select('id'),
  );
}

export async function cambiarEstadoDeRecurrente(cliente: Cliente, id: string, activo: boolean) {
  return alCambiar(
    await cliente.from('gastos_recurrentes').update({ activo }).eq('id', id).select('id'),
  );
}

const categoriaParaLaBase = (datos: DatosDeCategoria) => ({
  nombre: datos.nombre.trim(),
  pide_proveedor: datos.pideProveedor,
});

export async function crearCategoria(cliente: Cliente, datos: DatosDeCategoria) {
  return alCrear(
    await cliente
      .from('categorias_de_gasto')
      .insert(categoriaParaLaBase(datos))
      .select('id')
      .single(),
  );
}

export async function editarCategoria(cliente: Cliente, id: string, datos: DatosDeCategoria) {
  return alCambiar(
    await cliente
      .from('categorias_de_gasto')
      .update(categoriaParaLaBase(datos))
      .eq('id', id)
      .select('id'),
  );
}

export async function cambiarEstadoDeCategoria(cliente: Cliente, id: string, activo: boolean) {
  return alCambiar(
    await cliente.from('categorias_de_gasto').update({ activo }).eq('id', id).select('id'),
  );
}
