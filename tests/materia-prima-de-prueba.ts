import { randomUUID } from 'node:crypto';
import { clienteSecretoDePruebas } from './clientes';
import { asegurarLocalB, idDelLocalPrincipal } from './locales';

export type UnidadDeUso = 'g' | 'ml' | 'unidad';
export type SemillaDeInsumo = {
  otroLocal?: boolean;
  activo?: boolean;
  nombre?: string;
  unidad?: UnidadDeUso;
};
export type InsumoSembrado = { id: string; nombre: string; local_id: string };
export type SemillaDeForma = {
  insumoId: string;
  localId: string;
  proveedorId?: string | null;
  contenido?: number;
  precioCentavos?: number | null;
  activo?: boolean;
};

export function nombreDeInsumo(): string {
  return `Insumo ${randomUUID().slice(0, 8)}`;
}

/** Un insumo de prueba, activo, en gramos y en el local principal salvo que se pida otra cosa. */
export async function sembrarInsumo(semilla: SemillaDeInsumo = {}): Promise<InsumoSembrado> {
  const secreto = clienteSecretoDePruebas();
  const local = semilla.otroLocal ? asegurarLocalB : idDelLocalPrincipal;
  const fila = {
    local_id: await local(secreto),
    nombre: semilla.nombre ?? nombreDeInsumo(),
    unidad_de_uso: semilla.unidad ?? 'g',
    activo: semilla.activo ?? true,
  };
  const { data, error } = await secreto
    .from('insumos')
    .insert(fila)
    .select('id, nombre, local_id')
    .single();
  if (error) throw new Error(`No pude sembrar el insumo: ${error.message}`);
  return data;
}

/** Una forma de compra del insumo, "Bolsa de 25 kg" salvo que se pida otra cosa. */
export async function sembrarFormaDeCompra(semilla: SemillaDeForma): Promise<string> {
  const { data, error } = await clienteSecretoDePruebas()
    .from('formas_de_compra')
    .insert({
      local_id: semilla.localId,
      insumo_id: semilla.insumoId,
      proveedor_id: semilla.proveedorId ?? null,
      como_se_compra: 'Bolsa de 25 kg',
      contenido: semilla.contenido ?? 25000,
      precio_referencia_centavos:
        semilla.precioCentavos === undefined ? 3_200_000 : semilla.precioCentavos,
      activo: semilla.activo ?? true,
    })
    .select('id')
    .single();
  if (error) throw new Error(`No pude sembrar la forma de compra: ${error.message}`);
  return data.id;
}

/** Una fila de una tabla de Materia prima, leida sin RLS. */
export async function filaDe(tabla: 'insumos' | 'formas_de_compra', id: string) {
  const { data, error } = await clienteSecretoDePruebas()
    .from(tabla)
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(`No encontré ${id} en ${tabla}: ${error.message}`);
  return data as Record<string, unknown>;
}

/** Borra los insumos que creo un test, sus formas de compra y la auditoria de todo. */
export async function borrarInsumos(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const secreto = clienteSecretoDePruebas();
  const { data } = await secreto.from('formas_de_compra').select('id').in('insumo_id', ids);
  const formas = (data ?? []).map((fila) => fila.id);
  await secreto.from('formas_de_compra').delete().in('insumo_id', ids);
  await secreto.from('insumos').delete().in('id', ids);
  const { error } = await secreto
    .from('auditoria')
    .delete()
    .in('registro_id', [...ids, ...formas]);
  if (error) throw new Error(`No pude limpiar la auditoria: ${error.message}`);
}
