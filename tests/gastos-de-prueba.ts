import { randomUUID } from 'node:crypto';
import type { Cliente } from '../src/lib/supabase/cliente';
import { clienteSecretoDePruebas } from './clientes';
import { asegurarLocalB, idDelLocalPrincipal } from './locales';
import { clienteComo } from './sesiones';

export type SemillaDeGasto = {
  otroLocal?: boolean;
  categoria?: string;
  categoriaId?: string;
  montoCentavos?: number;
  fecha?: string;
  proveedorId?: string | null;
  anulado?: boolean;
  descripcion?: string | null;
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
    descripcion: semilla.descripcion ?? null,
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

export type SemillaDePorPagar = {
  vencimiento?: string;
  categoria?: string;
  categoriaId?: string;
  montoCentavos?: number;
  proveedorId?: string | null;
  descripcion?: string | null;
  recurrenteId?: string;
  otroLocal?: boolean;
};

/** Algo por pagar de prueba, por defecto $8.000 de Alquiler que vence el 2099-05-10. */
export async function sembrarPorPagar(semilla: SemillaDePorPagar = {}): Promise<{ id: string }> {
  const secreto = clienteSecretoDePruebas();
  const fila = {
    local_id: await localDe(secreto, semilla.otroLocal),
    vencimiento: semilla.vencimiento ?? '2099-05-10',
    categoria_id:
      semilla.categoriaId ??
      (await idDeCategoria(semilla.categoria ?? 'Alquiler', semilla.otroLocal)),
    monto_centavos: semilla.montoCentavos ?? 800000,
    proveedor_id: semilla.proveedorId ?? null,
    descripcion: semilla.descripcion ?? null,
    recurrente_id: semilla.recurrenteId ?? null,
  };
  const { data, error } = await secreto.from('gastos_por_pagar').insert(fila).select('id').single();
  comprobar(error, 'sembrar lo por pagar');
  return data!;
}

/** El admin de prueba paga algo por pagar: carga el gasto con por_pagar_id. */
export async function pagarComoAdmin(
  porPagarId: string,
  extra: { fecha?: string; montoCentavos?: number; medio?: string; categoriaId?: string } = {},
) {
  const admin = await clienteComo('admin');
  return admin
    .from('gastos')
    .insert({
      por_pagar_id: porPagarId,
      categoria_id: extra.categoriaId ?? (await idDeCategoria('Otros')),
      fecha: extra.fecha ?? '2026-10-20',
      monto_centavos: extra.montoCentavos ?? 800000,
      medio_de_pago: (extra.medio ?? 'transferencia') as 'transferencia',
    })
    .select('id')
    .single();
}

/**
 * Deja por pagar lo que vence de un fijo hasta esa fecha. Solo de ese fijo: generar todos con
 * una fecha lejana llena de pagos falsos los fijos de la base de pruebas.
 */
export async function generarDelFijo(fijo: string, hasta: string): Promise<number> {
  const { data, error } = await clienteSecretoDePruebas().rpc('generar_por_pagar', {
    hasta,
    el_fijo: fijo,
  });
  comprobar(error, 'generar lo del fijo');
  return data!;
}

type Pendiente = { id: string; categoria_id: string; monto_centavos: number };

async function pagarConLaClaveSecreta(pendiente: Pendiente, fecha: string): Promise<string> {
  const secreto = clienteSecretoDePruebas();
  const pago = {
    local_id: await idDelLocalPrincipal(secreto),
    por_pagar_id: pendiente.id,
    categoria_id: pendiente.categoria_id,
    fecha,
    monto_centavos: pendiente.monto_centavos,
    medio_de_pago: 'transferencia' as const,
  };
  const { data, error } = await secreto.from('gastos').insert(pago).select('id').single();
  comprobar(error, 'pagar lo del fijo');
  return data!.id;
}

/**
 * Paga, con la clave secreta, todo lo que un fijo dejo por pagar, con esa fecha y su monto.
 * Es para Playwright, que no tiene las sesiones de Vitest: la base copia los datos igual.
 */
export async function pagarLoDelFijo(recurrenteId: string, fecha: string): Promise<string[]> {
  const { data } = await clienteSecretoDePruebas()
    .from('gastos_por_pagar')
    .select('id, categoria_id, monto_centavos')
    .eq('recurrente_id', recurrenteId);
  const pagos: string[] = [];
  for (const pendiente of data ?? []) pagos.push(await pagarConLaClaveSecreta(pendiente, fecha));
  return pagos;
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
  const [gastos, recurrentes, porPagar] = await Promise.all([
    secreto.from('gastos').select('id').in('categoria_id', categorias),
    secreto.from('gastos_recurrentes').select('id').in('categoria_id', categorias),
    secreto.from('gastos_por_pagar').select('id').in('categoria_id', categorias),
  ]);
  await borrarGastos({
    gastos: (gastos.data ?? []).map((g) => g.id),
    recurrentes: (recurrentes.data ?? []).map((r) => r.id),
    porPagar: (porPagar.data ?? []).map((p) => p.id),
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

const idsDe = (filas: { id: string }[] | null) => (filas ?? []).map((fila) => fila.id);

/** Lo por pagar que dejaron esos fijos, mas lo pedido. */
async function porPagarDe(secreto: Cliente, recurrentes: string[], pedidos: string[]) {
  const generados = await secreto
    .from('gastos_por_pagar')
    .select('id')
    .in('recurrente_id', recurrentes);
  return [...pedidos, ...idsDe(generados.data)];
}

/** Los gastos pedidos, los que cargaron esos fijos y los pagos de lo por pagar. */
async function gastosDe(
  secreto: Cliente,
  recurrentes: string[],
  porPagar: string[],
  pedidos: string[],
) {
  const [generados, pagos] = await Promise.all([
    secreto.from('gastos').select('id').in('recurrente_id', recurrentes),
    secreto.from('gastos').select('id').in('por_pagar_id', porPagar),
  ]);
  return [...pedidos, ...idsDe(generados.data), ...idsDe(pagos.data)];
}

type IdsDeGastos = {
  gastos?: string[];
  recurrentes?: string[];
  porPagar?: string[];
  categorias?: string[];
};

/** Borra lo que creo un test, con su auditoria. En la aplicacion nada se borra. */
export async function borrarGastos(ids: IdsDeGastos) {
  const secreto = clienteSecretoDePruebas();
  const recurrentes = ids.recurrentes ?? [];
  const porPagar = await porPagarDe(secreto, recurrentes, ids.porPagar ?? []);
  const gastos = await gastosDe(secreto, recurrentes, porPagar, ids.gastos ?? []);
  await secreto.from('gastos').delete().in('id', gastos);
  await secreto.from('gastos_por_pagar').delete().in('id', porPagar);
  await secreto.from('gastos_recurrentes').delete().in('id', recurrentes);
  await secreto
    .from('categorias_de_gasto')
    .delete()
    .in('id', ids.categorias ?? []);
  const todos = [...gastos, ...porPagar, ...recurrentes, ...(ids.categorias ?? [])];
  const { error } = await secreto.from('auditoria').delete().in('registro_id', todos);
  comprobar(error, 'limpiar la auditoria de gastos');
}
