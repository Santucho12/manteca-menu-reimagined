import { estadoDeFila, type EstadoDelTurno, type FilaDelEstado } from '../caja/turnos';
import type { Cliente } from '../supabase/cliente';
import { catalogoDeFilas, type CategoriaParaVender } from './catalogo';

/**
 * Lo que se vende en el mostrador: cada producto activo con el precio que rige, se muestre o no
 * en la carta. Lo lee Caja, que no ve las tablas del menú: sale de una función de la base.
 */
export async function catalogoParaVender(cliente: Cliente): Promise<CategoriaParaVender[]> {
  const { data, error } = await cliente.rpc('catalogo_para_vender');
  if (error) throw new Error(`No pudimos leer lo que se vende: ${error.message}`);
  return catalogoDeFilas(data ?? []);
}

/** A qué turno va una venta ahora y si el mostrador está trabado por un cierre, sin montos. */
export async function estadoDelMostrador(cliente: Cliente): Promise<EstadoDelTurno> {
  const { data, error } = await cliente.rpc('caja_estado_del_mostrador');
  if (error) throw new Error(`No pudimos leer el estado de la caja: ${error.message}`);
  return estadoDeFila((data as unknown as FilaDelEstado[])[0]!);
}

export type TipoParaVender = {
  id: string;
  nombre: string;
  deSistema: boolean;
  seControla: boolean;
};

/** Los tipos de venta activos para elegir en Vender, Local primero. */
export async function tiposParaVender(cliente: Cliente): Promise<TipoParaVender[]> {
  const { data, error } = await cliente.rpc('caja_tipos_para_vender');
  if (error) throw new Error(`No pudimos leer los tipos de venta: ${error.message}`);
  return (data ?? []).map((t) => ({
    id: t.id,
    nombre: t.nombre,
    deSistema: t.de_sistema,
    seControla: t.se_controla_en_el_cierre,
  }));
}

export type PorArmar = {
  ventaId: string;
  renglonId: string;
  cerradaEn: string;
  descripcion: string;
  categoriaId: string;
  unidades: number;
};

/** Las facturas surtidas cobradas que falta armar, de hoy y de ayer (pedido 102). */
export async function porArmar(cliente: Cliente): Promise<PorArmar[]> {
  const { data, error } = await cliente.rpc('ventas_por_armar');
  if (error) throw new Error(`No pudimos leer lo que falta armar: ${error.message}`);
  return (data ?? []).map((p) => ({
    ventaId: p.venta_id,
    renglonId: p.renglon_id,
    cerradaEn: p.cerrada_en,
    descripcion: p.descripcion,
    categoriaId: p.categoria_id,
    unidades: p.unidades,
  }));
}
