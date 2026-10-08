import { randomUUID } from 'node:crypto';
import { clienteSecretoDePruebas } from './clientes';
import { asegurarLocalB, idDelLocalPrincipal } from './locales';

export type SemillaDeProveedor = {
  otroLocal?: boolean;
  activo?: boolean;
  nombre?: string;
  telefono?: string | null;
};
export type ProveedorSembrado = { id: string; nombre: string };

export function nombreDeProveedor(): string {
  return `Proveedor ${randomUUID().slice(0, 8)}`;
}

/** Un proveedor de prueba, activo y en el local principal salvo que se pida otra cosa. */
export async function sembrarProveedor(
  semilla: SemillaDeProveedor = {},
): Promise<ProveedorSembrado> {
  const secreto = clienteSecretoDePruebas();
  const local = semilla.otroLocal ? asegurarLocalB : idDelLocalPrincipal;
  const fila = {
    local_id: await local(secreto),
    nombre: semilla.nombre ?? nombreDeProveedor(),
    telefono: semilla.telefono ?? null,
    activo: semilla.activo ?? true,
  };
  const { data, error } = await secreto
    .from('proveedores')
    .insert(fila)
    .select('id, nombre')
    .single();
  if (error) throw new Error(`No pude sembrar el proveedor: ${error.message}`);
  return data;
}

/** Una fila de proveedores, leida sin RLS. */
export async function proveedorDe(id: string) {
  const { data, error } = await clienteSecretoDePruebas()
    .from('proveedores')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(`No encontré el proveedor ${id}: ${error.message}`);
  return data as Record<string, unknown>;
}

/** Borra lo que creo un test, con su auditoria. En la aplicacion nada se borra. */
export async function borrarProveedores(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const secreto = clienteSecretoDePruebas();
  await secreto.from('proveedores').delete().in('id', ids);
  const { error } = await secreto.from('auditoria').delete().in('registro_id', ids);
  if (error) throw new Error(`No pude limpiar la auditoria: ${error.message}`);
}

/** Los ids de los proveedores con estos nombres: los que crea una prueba en vivo. */
export async function idsDeProveedoresLlamados(nombres: string[]): Promise<string[]> {
  const { data } = await clienteSecretoDePruebas()
    .from('proveedores')
    .select('id')
    .in('nombre', nombres);
  return (data ?? []).map((fila) => fila.id);
}
