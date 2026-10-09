import { randomUUID } from 'node:crypto';
import type { Cliente } from '../src/lib/supabase/cliente';
import { clienteSecretoDePruebas } from './clientes';
import { asegurarLocalB, idDelLocalPrincipal } from './locales';

export type SemillaDeGasto = {
  otroLocal?: boolean;
  categoria?: string;
  categoriaId?: string;
  montoCentavos?: number;
  fecha?: string;
  proveedorId?: string | null;
  anulado?: boolean;
};
export type SemillaDeRecurrente = {
  categoria?: string;
  montoCentavos?: number;
  frecuencia?: 'mensual' | 'bimestral' | 'anual';
  primerVencimiento: string;
  proveedorId?: string | null;
  activo?: boolean;
  otroLocal?: boolean;
};

function comprobar(error: { message: string } | null, que: string): void {
  if (error) throw new Error(`No pude ${que}: ${error.message}`);
}

async function localDe(secreto: Cliente, otroLocal = false): Promise<string> {
  return otroLocal ? asegurarLocalB(secreto) : idDelLocalPrincipal(secreto);
}

/** El id de una categoria que la migracion carga en cada local, como Mercaderia o Alquiler. */
export async function idDeCategoria(nombre: string, otroLocal = false): Promise<string> {
  const secreto = clienteSecretoDePruebas();
  const { data, error } = await secreto
    .from('categorias_de_gasto')
    .select('id')
    .eq('local_id', await localDe(secreto, otroLocal))
    .eq('nombre', nombre)
    .single();
  comprobar(error, `encontrar la categoria ${nombre}`);
  return data!.id;
}

/** Una categoria de prueba con nombre unico. */
export async function sembrarCategoriaDeGasto(
  semilla: { otroLocal?: boolean; activo?: boolean; pideProveedor?: boolean } = {},
): Promise<{ id: string; nombre: string }> {
  const secreto = clienteSecretoDePruebas();
  const fila = {
    local_id: await localDe(secreto, semilla.otroLocal),
    nombre: `Categoria ${randomUUID().slice(0, 8)}`,
    pide_proveedor: semilla.pideProveedor ?? false,
    activo: semilla.activo ?? true,
  };
  const { data, error } = await secreto
    .from('categorias_de_gasto')
    .insert(fila)
    .select('id, nombre')
    .single();
  comprobar(error, 'sembrar la categoria');
  return data!;
}

async function filaDeGasto(secreto: Cliente, semilla: SemillaDeGasto) {
  const categoria =
    semilla.categoriaId ??
    (await idDeCategoria(semilla.categoria ?? 'Alquiler', semilla.otroLocal));
  return {
    local_id: await localDe(secreto, semilla.otroLocal),
    fecha: semilla.fecha ?? '2026-10-05',
    categoria_id: categoria,
    monto_centavos: semilla.montoCentavos ?? 1234550,
    proveedor_id: semilla.proveedorId ?? null,
    medio_de_pago: 'transferencia' as const,
    anulado: semilla.anulado ?? false,
    motivo_anulacion: semilla.anulado ? 'Cargado de mas' : null,
  };
}

/** Un gasto de prueba, por defecto de $12.345,50 en Alquiler. */
export async function sembrarGasto(semilla: SemillaDeGasto = {}): Promise<{ id: string }> {
  const secreto = clienteSecretoDePruebas();
  const { data, error } = await secreto
    .from('gastos')
    .insert(await filaDeGasto(secreto, semilla))
    .select('id')
    .single();
  comprobar(error, 'sembrar el gasto');
  return data!;
}

export async function sembrarRecurrente(semilla: SemillaDeRecurrente): Promise<{ id: string }> {
  const secreto = clienteSecretoDePruebas();
  const fila = {
    local_id: await localDe(secreto, semilla.otroLocal),
    categoria_id: await idDeCategoria(semilla.categoria ?? 'Alquiler', semilla.otroLocal),
    monto_centavos: semilla.montoCentavos ?? 50000000,
    proveedor_id: semilla.proveedorId ?? null,
    medio_de_pago: 'transferencia' as const,
    frecuencia: semilla.frecuencia ?? 'mensual',
    primer_vencimiento: semilla.primerVencimiento,
    activo: semilla.activo ?? true,
  };
  const { data, error } = await secreto
    .from('gastos_recurrentes')
    .insert(fila)
    .select('id')
    .single();
  comprobar(error, 'sembrar el recurrente');
  return data!;
}

/** Una fila de gastos, leida sin RLS. */
export async function gastoDe(id: string) {
  const { data, error } = await clienteSecretoDePruebas()
    .from('gastos')
    .select('*')
    .eq('id', id)
    .single();
  comprobar(error, `leer el gasto ${id}`);
  return data as Record<string, unknown>;
}

/** Las categorias de prueba y todos sus gastos, tambien los que se cargaron por pantalla. */
export async function borrarCategoriasConSusGastos(categorias: string[]) {
  const secreto = clienteSecretoDePruebas();
  const [gastos, recurrentes] = await Promise.all([
    secreto.from('gastos').select('id').in('categoria_id', categorias),
    secreto.from('gastos_recurrentes').select('id').in('categoria_id', categorias),
  ]);
  await borrarGastos({
    gastos: (gastos.data ?? []).map((g) => g.id),
    recurrentes: (recurrentes.data ?? []).map((r) => r.id),
    categorias,
  });
}

/** Los ids de las categorias cargadas por pantalla con esos nombres. */
export async function idsDeCategoriasLlamadas(nombres: string[]): Promise<string[]> {
  const { data } = await clienteSecretoDePruebas()
    .from('categorias_de_gasto')
    .select('id')
    .in('nombre', nombres);
  return (data ?? []).map((c) => c.id);
}

/** Borra lo que creo un test, con su auditoria. En la aplicacion nada se borra. */
export async function borrarGastos(ids: {
  gastos?: string[];
  recurrentes?: string[];
  categorias?: string[];
}) {
  const secreto = clienteSecretoDePruebas();
  const recurrentes = ids.recurrentes ?? [];
  const generados = await secreto.from('gastos').select('id').in('recurrente_id', recurrentes);
  const gastos = [...(ids.gastos ?? []), ...(generados.data ?? []).map((g) => g.id)];
  await secreto.from('gastos').delete().in('id', gastos);
  await secreto.from('gastos_recurrentes').delete().in('id', recurrentes);
  await secreto
    .from('categorias_de_gasto')
    .delete()
    .in('id', ids.categorias ?? []);
  const todos = [...gastos, ...recurrentes, ...(ids.categorias ?? [])];
  const { error } = await secreto.from('auditoria').delete().in('registro_id', todos);
  comprobar(error, 'limpiar la auditoria de gastos');
}
