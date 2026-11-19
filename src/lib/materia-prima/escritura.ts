import { exito, fallo, type Resultado } from '../resultado';
import type { Cliente } from '../supabase/cliente';
import { nombreDeInsumoRepetido } from './consultas';
import {
  formaParaLaBase,
  insumoParaLaBase,
  type DatosDeFormaDeCompra,
  type DatosDeInsumo,
} from './esquemas';

export const MENSAJES_DE_MATERIA_PRIMA = {
  sinPermiso: 'No tenés permiso para hacer esto.',
  insumoNoDisponible: 'Ese insumo ya no está disponible. Recargá la página.',
  formaNoDisponible: 'Esa forma de compra ya no está disponible. Recargá la página.',
  ajeno: 'Ese insumo o ese proveedor ya no está disponible. Recargá la página.',
  insumoApagado: 'Reactivá primero el insumo.',
  generico: 'No pudimos guardarlo. Revisá los datos e intentá de nuevo.',
} as const;

export type Creado = { estado: 'creado'; id: string } | { estado: 'confirmar'; nombre: string };

const POR_CODIGO: Record<string, string> = {
  '42501': MENSAJES_DE_MATERIA_PRIMA.sinPermiso,
  PI301: MENSAJES_DE_MATERIA_PRIMA.ajeno,
  PI302: MENSAJES_DE_MATERIA_PRIMA.insumoApagado,
};

function mensajeDe(error: { code?: string | null }): string {
  return POR_CODIGO[error.code ?? ''] ?? MENSAJES_DE_MATERIA_PRIMA.generico;
}

/** Si ya hay uno con ese nombre, pregunta antes: puede ser el mismo cargado dos veces. */
export async function crearInsumo(
  cliente: Cliente,
  datos: DatosDeInsumo,
  confirmar: boolean,
): Promise<Resultado<Creado>> {
  const repetido = confirmar ? null : await nombreDeInsumoRepetido(cliente, datos.nombre);
  if (repetido) return exito({ estado: 'confirmar', nombre: repetido });
  const { data, error } = await cliente
    .from('insumos')
    .insert(insumoParaLaBase(datos))
    .select('id')
    .single();
  return error ? fallo(mensajeDe(error)) : exito({ estado: 'creado', id: data.id });
}

type Tabla = 'insumos' | 'formas_de_compra';
const NO_DISPONIBLE: Record<Tabla, string> = {
  insumos: MENSAJES_DE_MATERIA_PRIMA.insumoNoDisponible,
  formas_de_compra: MENSAJES_DE_MATERIA_PRIMA.formaNoDisponible,
};

// RLS no da error si la fila no es del local: se comprueba que haya cambiado una.
type Cambiadas = PromiseLike<{ data: { id: string }[] | null; error: { code?: string } | null }>;

async function revisar(tabla: Tabla, cambio: Cambiadas): Promise<Resultado> {
  const { data, error } = await cambio;
  if (error) return fallo(mensajeDe(error));
  return data?.length === 1 ? exito(undefined) : fallo(NO_DISPONIBLE[tabla]);
}

type CambioDeInsumo = ReturnType<typeof insumoParaLaBase> | { activo: boolean };
type CambioDeForma = ReturnType<typeof formaParaLaBase> | { activo: boolean };

function cambiarInsumo(cliente: Cliente, id: string, cambios: CambioDeInsumo) {
  return revisar('insumos', cliente.from('insumos').update(cambios).eq('id', id).select('id'));
}

function cambiarForma(cliente: Cliente, id: string, cambios: CambioDeForma) {
  const tabla = 'formas_de_compra';
  return revisar(tabla, cliente.from(tabla).update(cambios).eq('id', id).select('id'));
}

export function editarInsumo(cliente: Cliente, id: string, datos: DatosDeInsumo) {
  return cambiarInsumo(cliente, id, insumoParaLaBase(datos));
}

export function cambiarEstadoDeInsumo(cliente: Cliente, id: string, activo: boolean) {
  return cambiarInsumo(cliente, id, { activo });
}

export async function crearFormaDeCompra(
  cliente: Cliente,
  insumoId: string,
  datos: DatosDeFormaDeCompra,
): Promise<Resultado<{ id: string }>> {
  const { data, error } = await cliente
    .from('formas_de_compra')
    .insert({ insumo_id: insumoId, ...formaParaLaBase(datos) })
    .select('id')
    .single();
  return error ? fallo(mensajeDe(error)) : exito({ id: data.id });
}

export function editarFormaDeCompra(cliente: Cliente, id: string, datos: DatosDeFormaDeCompra) {
  return cambiarForma(cliente, id, formaParaLaBase(datos));
}

export function cambiarEstadoDeForma(cliente: Cliente, id: string, activo: boolean) {
  return cambiarForma(cliente, id, { activo });
}
