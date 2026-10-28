import type { Cliente } from '../supabase/cliente';
import {
  agruparPorCategoria,
  type GastoParaAgrupar,
  type ResumenDeCategoria,
} from './porCategoria';
import type { TipoDeGasto } from './pantalla';

type Rango = { desde: string; hasta: string; tipo: TipoDeGasto | null };
type Leido = Omit<GastoParaAgrupar, 'categoria'> & { categoria: { nombre: string } | null };

const POR_LECTURA = 1000;
const COLUMNAS =
  'id, fecha, descripcion, categoria_id, monto_centavos, categoria:categorias_de_gasto(nombre)';

function lectura(cliente: Cliente, rango: Rango, desde: number) {
  let consulta = cliente
    .from('gastos')
    .select(COLUMNAS)
    .eq('anulado', false)
    .gte('fecha', rango.desde)
    .lte('fecha', rango.hasta);
  if (rango.tipo === 'fijos') consulta = consulta.not('recurrente_id', 'is', null);
  if (rango.tipo === 'caja') consulta = consulta.not('cierre_id', 'is', null);
  return consulta.order('id').range(desde, desde + POR_LECTURA - 1);
}

async function gastosDelRango(cliente: Cliente, rango: Rango): Promise<GastoParaAgrupar[]> {
  const gastos: GastoParaAgrupar[] = [];
  for (let desde = 0; ; desde += POR_LECTURA) {
    const { data, error } = await lectura(cliente, rango, desde);
    if (error) throw new Error(`No pudimos leer las categorias: ${error.message}`);
    const pagina = (data ?? []) as unknown as Leido[];
    gastos.push(...pagina.map((g) => ({ ...g, categoria: g.categoria?.nombre ?? '' })));
    if (pagina.length < POR_LECTURA) return gastos;
  }
}

/** Una tarjeta por categoria con los gastos sin anular del rango; no mira la categoria elegida. */
export async function resumenPorCategoria(
  cliente: Cliente,
  rango: Rango,
): Promise<ResumenDeCategoria[]> {
  return agruparPorCategoria(await gastosDelRango(cliente, rango));
}
