import { exito, fallo, type Resultado } from '../resultado';
import type { Cliente } from '../supabase/cliente';
import { precioAumentado, type RedondeoCentavos } from './aumento';
import { mensajeDelMenu, nombresDelDetalle, type ErrorDeLaBase } from './errores';
import {
  categoriaParaLaBase,
  productoParaLaBase,
  type DatosDeAplicarAumento,
  type DatosDeCategoria,
  type DatosDeProducto,
  type ElementoDelMenu,
} from './esquemas';

export type Guardado =
  | { estado: 'guardado'; id: string; ocultados: string[] }
  | { estado: 'confirmar'; productos: string[] };

type RespuestaDeGuardado = { data: unknown; error: (ErrorDeLaBase & object) | null };

// PM101 no es un error para la persona: es la pregunta "¿los oculto?".
function guardadoDe({ data, error }: RespuestaDeGuardado): Resultado<Guardado> {
  if (error?.code === 'PM101')
    return exito({ estado: 'confirmar', productos: nombresDelDetalle(error) });
  if (error) return fallo(mensajeDelMenu(error));
  const { id, ocultados } = data as { id: string; ocultados: string[] };
  return exito({ estado: 'guardado', id, ocultados });
}

function resultadoDe(error: ErrorDeLaBase): Resultado {
  return error ? fallo(mensajeDelMenu(error)) : exito(undefined);
}

export async function guardarCategoria(
  cliente: Cliente,
  datos: DatosDeCategoria,
  confirmar: boolean,
) {
  return guardadoDe(
    await cliente.rpc('menu_guardar_categoria', { datos: categoriaParaLaBase(datos), confirmar }),
  );
}

export async function guardarProducto(
  cliente: Cliente,
  datos: DatosDeProducto,
  confirmar: boolean,
) {
  return guardadoDe(
    await cliente.rpc('menu_guardar_producto', { datos: productoParaLaBase(datos), confirmar }),
  );
}

export async function cambiarVisibilidad(
  cliente: Cliente,
  { tipo, id, mostrar }: ElementoDelMenu & { mostrar: boolean },
) {
  const { error } = await cliente.rpc('menu_cambiar_visibilidad', {
    el_tipo: tipo,
    el_id: id,
    mostrar,
  });
  return resultadoDe(error);
}

export async function mover(
  cliente: Cliente,
  { tipo, id, direccion }: ElementoDelMenu & { direccion: 'arriba' | 'abajo' },
) {
  const { error } = await cliente.rpc('menu_mover', { el_tipo: tipo, el_id: id, direccion });
  return resultadoDe(error);
}

export async function desactivar(cliente: Cliente, { tipo, id }: ElementoDelMenu) {
  return resultadoDe((await cliente.rpc('menu_desactivar', { el_tipo: tipo, el_id: id })).error);
}

export async function reactivar(cliente: Cliente, { tipo, id }: ElementoDelMenu) {
  return resultadoDe((await cliente.rpc('menu_reactivar', { el_tipo: tipo, el_id: id })).error);
}

/** El precio nuevo lo calcula el servidor; del navegador llega solo el precio que se vio antes. */
export async function aplicarAumento(
  cliente: Cliente,
  datos: DatosDeAplicarAumento,
): Promise<Resultado<{ cantidad: number }>> {
  const porcentaje = Number(datos.porcentaje);
  const redondeo = Number(datos.redondeo) as RedondeoCentavos;
  const precios = datos.precios.map((p) => ({
    id: p.id,
    antes_centavos: p.antesCentavos,
    despues_centavos: precioAumentado(p.antesCentavos, porcentaje, redondeo),
  }));
  const aumento = {
    porcentaje,
    redondeo_centavos: redondeo,
    categoria_id: datos.categoriaId || null,
    precios,
  };
  const { error } = await cliente.rpc('menu_aplicar_aumento', { datos: aumento });
  return error ? fallo(mensajeDelMenu(error)) : exito({ cantidad: precios.length });
}
