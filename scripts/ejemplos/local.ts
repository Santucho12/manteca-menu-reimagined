import type { Cliente } from '../../src/lib/supabase/cliente';
import type { FormaDeEjemplo } from './ventas';

function comprobar(error: { message: string } | null, que: string): void {
  if (error) throw new Error(`No pude ${que}: ${error.message}`);
}

/** El local de ejemplo: el que ya está con ese nombre, o uno nuevo. Local trae su tipo de venta. */
export async function asegurarLocal(secreto: Cliente, nombre: string): Promise<string> {
  const { data } = await secreto.from('locales').select('id').eq('nombre', nombre).maybeSingle();
  if (data) return data.id;
  const creado = await secreto.from('locales').insert({ nombre }).select('id').single();
  comprobar(creado.error, 'crear el local de ejemplo');
  return creado.data!.id;
}

const CANALES = ['Cheaf', 'Encargo', 'Venta a comercios', 'Otro'];
const CATEGORIAS_DE_GASTO = [
  { nombre: 'Mercadería', pide_proveedor: true, de_sistema: false },
  ...['Alquiler', 'Servicios', 'Sueldos', 'Impuestos', 'Mantenimiento', 'Otros'].map((nombre) => ({
    nombre,
    pide_proveedor: false,
    de_sistema: false,
  })),
  { nombre: 'Sin clasificar', pide_proveedor: false, de_sistema: true },
];

async function faltantes(
  secreto: Cliente,
  tabla: 'canales_de_venta' | 'categorias_de_gasto',
  local: string,
  nombres: string[],
) {
  const { data } = await secreto.from(tabla).select('nombre').eq('local_id', local);
  const ya = new Set((data ?? []).map((fila) => fila.nombre));
  return nombres.filter((nombre) => !ya.has(nombre));
}

/** Los tipos de venta y las categorías de gasto de arranque, como los del local principal. */
export async function asegurarCatalogos(secreto: Cliente, local: string): Promise<void> {
  const canales = await faltantes(secreto, 'canales_de_venta', local, CANALES);
  const enCanales = await secreto
    .from('canales_de_venta')
    .insert(canales.map((nombre) => ({ local_id: local, nombre })));
  comprobar(enCanales.error, 'sumar los tipos de venta');
  const nombres = await faltantes(
    secreto,
    'categorias_de_gasto',
    local,
    CATEGORIAS_DE_GASTO.map((c) => c.nombre),
  );
  const filas = CATEGORIAS_DE_GASTO.filter((c) => nombres.includes(c.nombre));
  const enGastos = await secreto
    .from('categorias_de_gasto')
    .insert(filas.map((c) => ({ ...c, local_id: local })));
  comprobar(enGastos.error, 'sumar las categorías de gasto');
}

/** Lo que vende el mostrador del local de ejemplo, leído con la sesión de su caja. */
export async function formasDelLocal(caja: Cliente): Promise<FormaDeEjemplo[]> {
  const { data, error } = await caja.rpc('catalogo_para_vender');
  comprobar(error, 'leer el catálogo del local de ejemplo');
  return (data ?? []).map((fila) => ({
    productoId: fila.producto_id,
    presentacionId: fila.presentacion_id,
    descripcion: `${fila.producto} · ${fila.presentacion}`,
    precioCentavos: fila.precio_centavos,
  }));
}

/** Un mapa de nombre a id: categorías de gasto o proveedores del local. */
export async function idsPorNombre(
  cliente: Cliente,
  tabla: 'categorias_de_gasto' | 'proveedores',
  local: string,
): Promise<Map<string, string>> {
  const { data, error } = await cliente.from(tabla).select('id, nombre').eq('local_id', local);
  comprobar(error, `leer ${tabla}`);
  return new Map((data ?? []).map((fila) => [fila.nombre, fila.id]));
}
