import { exito, fallo, type Resultado } from '../resultado';
import type { Cliente } from '../supabase/cliente';
import {
  gastoParaLaBase,
  recurrenteParaLaBase,
  type DatosDeCategoria,
  type DatosDeGasto,
  type DatosDeRecurrente,
} from './esquemas';

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
};

type Respuesta = {
  data: { id: string }[] | { id: string } | null;
  error: { code?: string } | null;
};

const mensajeDe = (error: { code?: string }) =>
  POR_CODIGO[error.code ?? ''] ?? MENSAJES_DE_GASTOS.generico;

function alCrear({ data, error }: Respuesta): Resultado<{ id: string }> {
  if (error) return fallo(mensajeDe(error));
  return exito({ id: (data as { id: string }).id });
}

// RLS no da error si la fila no es del local: se comprueba que haya cambiado una.
function alCambiar({ data, error }: Respuesta): Resultado {
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

export async function crearRecurrente(cliente: Cliente, datos: DatosDeRecurrente) {
  return alCrear(
    await cliente
      .from('gastos_recurrentes')
      .insert(recurrenteParaLaBase(datos))
      .select('id')
      .single(),
  );
}

export async function editarRecurrente(cliente: Cliente, id: string, datos: DatosDeRecurrente) {
  return alCambiar(
    await cliente
      .from('gastos_recurrentes')
      .update(recurrenteParaLaBase(datos))
      .eq('id', id)
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
