import type { Cliente } from '../src/lib/supabase/cliente';

export const NOMBRE_DEL_LOCAL_PRINCIPAL = 'Manteca';
export const NOMBRE_DEL_LOCAL_B = 'Local de prueba B';

/** El local mas antiguo: ahi van las cuentas nuevas. */
export async function idDelLocalPrincipal(secreto: Cliente): Promise<string> {
  const { data, error } = await secreto
    .from('locales')
    .select('id')
    .order('fecha_creacion')
    .order('id')
    .limit(1)
    .single();
  if (error) throw new Error(`No encontré el local principal: ${error.message}`);
  return data.id;
}

/** El segundo local existe solo en la base de pruebas: lo crea la siembra. */
export async function asegurarLocalB(secreto: Cliente): Promise<string> {
  const { data } = await secreto
    .from('locales')
    .select('id')
    .eq('nombre', NOMBRE_DEL_LOCAL_B)
    .maybeSingle();
  if (data) return data.id;
  const creado = await secreto
    .from('locales')
    .insert({ nombre: NOMBRE_DEL_LOCAL_B })
    .select('id')
    .single();
  if (creado.error) throw new Error(`No pude crear el local B: ${creado.error.message}`);
  return creado.data.id;
}
