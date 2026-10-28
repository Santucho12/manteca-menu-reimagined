import { exito, fallo, type Resultado } from '../resultado';
import type { Cliente } from '../supabase/cliente';
import { recurrentePorId } from './consultas';
import { alCambiar, alCrear, MENSAJES_DE_GASTOS } from './escritura';
import { pagoParaLaBase, type DatosDePago } from './esquemas';
import { tomadosDe, type Pendiente } from './porPagar';

/** Lo por pagar vigente y sin pago, por vencimiento. RLS decide qué ve cada uno. */
export async function pagosPendientes(cliente: Cliente): Promise<Pendiente[]> {
  const { data, error } = await cliente.rpc('pagos_pendientes');
  if (error) throw new Error(`No pudimos leer lo por pagar: ${error.message}`);
  return (data ?? []) as unknown as Pendiente[];
}

/** Los vencimientos de fijos después de hoy que ya tienen su por pagar: pagados o anulados. */
export async function vencimientosTomados(cliente: Cliente, hoy: string): Promise<Set<string>> {
  const { data, error } = await cliente
    .from('gastos_por_pagar')
    .select('recurrente_id, vencimiento')
    .not('recurrente_id', 'is', null)
    .gt('vencimiento', hoy);
  if (error) throw new Error(`No pudimos leer los pagos de los fijos: ${error.message}`);
  return tomadosDe(data as { recurrente_id: string; vencimiento: string }[]);
}

/** El por pagar de un vencimiento de un fijo: lo crea, o lo encuentra si ya estaba. */
async function porPagarDelFijo(cliente: Cliente, fijoId: string, vencimiento: string) {
  const fijo = await recurrentePorId(cliente, fijoId);
  if (!fijo) return fallo(MENSAJES_DE_GASTOS.noDisponible);
  // La categoría y el monto los copia la base del fijo; van porque la tabla los pide.
  const fila = { recurrente_id: fijoId, vencimiento, categoria_id: fijo.categoria_id };
  const tabla = () => cliente.from('gastos_por_pagar');
  const creado = await tabla()
    .insert({ ...fila, monto_centavos: fijo.monto_centavos })
    .select('id')
    .single();
  if (creado.error?.code !== '23505') return alCrear(creado);
  return alCrear(
    await tabla().select('id').eq('recurrente_id', fijoId).eq('vencimiento', vencimiento).single(),
  );
}

async function categoriaDe(cliente: Cliente, porPagarId: string): Promise<string | null> {
  const { data } = await cliente
    .from('gastos_por_pagar')
    .select('categoria_id')
    .eq('id', porPagarId)
    .maybeSingle();
  return data?.categoria_id ?? null;
}

/** Con la misma clave es el mismo pago (un toque repetido); si no, ya lo había pagado otro. */
async function pagoRepetido(cliente: Cliente, clave: string): Promise<Resultado<{ id: string }>> {
  const mismo = await cliente.from('gastos').select('id').eq('clave', clave).maybeSingle();
  return mismo.data ? exito({ id: mismo.data.id }) : fallo(MENSAJES_DE_GASTOS.yaPagado);
}

/**
 * Pagar: carga el gasto con la fecha, el monto y el medio del pago; la categoría, el proveedor,
 * la descripción y el fijo los copia la base de lo por pagar.
 */
export async function pagar(cliente: Cliente, datos: DatosDePago) {
  const cual = datos.porPagarId
    ? exito({ id: datos.porPagarId })
    : await porPagarDelFijo(cliente, datos.fijoId!, datos.vencimiento!);
  if (!cual.ok) return cual;
  const categoria = await categoriaDe(cliente, cual.datos.id);
  if (!categoria) return fallo(MENSAJES_DE_GASTOS.noDisponible);
  const fila = pagoParaLaBase(datos, cual.datos.id, categoria);
  const creado = await cliente.from('gastos').insert(fila).select('id').single();
  if (creado.error?.code === '23505') return pagoRepetido(cliente, datos.clave);
  return alCrear(creado);
}

/** No se paga: se anula con motivo y deja de figurar. Lo pagado se anula desde su pago. */
export async function anularPorPagar(cliente: Cliente, id: string, motivo: string) {
  return alCambiar(
    await cliente
      .from('gastos_por_pagar')
      .update({ anulado: true, motivo_anulacion: motivo })
      .eq('id', id)
      .select('id'),
  );
}
