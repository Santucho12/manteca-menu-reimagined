import type { Cliente } from '../../src/lib/supabase/cliente';
import { borrarCuentasDeEjemplo } from './cuentas';
import { borrarMenu } from './menu';

// En este orden: cada tabla se borra antes que aquella a la que apunta.
const DATOS = [
  'pagos_de_venta',
  'renglones_de_venta',
  'ventas',
  'gastos',
  'gastos_por_pagar',
  'retiros_de_caja',
  'dias_sin_abrir',
  'cierres_de_caja',
  'proveedores',
] as const;

const CATALOGOS = ['canales_de_venta', 'categorias_de_gasto', 'configuracion_de_caja'] as const;

type Tabla = (typeof DATOS)[number] | (typeof CATALOGOS)[number];

async function borrarDe(secreto: Cliente, tablas: readonly Tabla[], local: string) {
  for (const tabla of tablas) {
    const { error } = await secreto.from(tabla).delete().eq('local_id', local);
    if (error) throw new Error(`No pude borrar ${tabla}: ${error.message}`);
  }
}

/**
 * Borra lo inventado del local de ejemplo (ventas, cierres, gastos, proveedores) y su auditoría,
 * para volver a armarlo. Nunca toca otro local: todo se borra por el id del local de ejemplo.
 */
export async function borrarDatosDeEjemplo(secreto: Cliente, local: string): Promise<void> {
  await borrarDe(secreto, DATOS, local);
  await secreto.from('auditoria').delete().eq('local_id', local);
}

/** Lo que crea la prueba del comando: el local de ejemplo entero, con sus cuentas. */
export async function borrarLocalDeEjemplo(
  secreto: Cliente,
  opciones: { local: string; prefijo: string },
): Promise<void> {
  const { data } = await secreto
    .from('locales')
    .select('id')
    .eq('nombre', opciones.local)
    .maybeSingle();
  if (data) await borrarDatosDeEjemplo(secreto, data.id);
  await borrarCuentasDeEjemplo(secreto, opciones.prefijo);
  if (!data) return;
  await borrarMenu(secreto, data.id);
  await borrarDe(secreto, CATALOGOS, data.id);
  await secreto.from('auditoria').delete().eq('local_id', data.id);
  await secreto.from('locales').delete().eq('id', data.id);
}
