import type { Cliente } from '../../src/lib/supabase/cliente';
import type { CierreDeEjemplo } from './cierres';
import { PROVEEDORES_DE_EJEMPLO, type GastoDeEjemplo } from './gastos';
import { idsPorNombre } from './local';
import type { VentaDeEjemplo } from './ventas';

const TANDA = 300;

function comprobar(error: { message: string } | null, que: string): void {
  if (error) throw new Error(`No pude ${que}: ${error.message}`);
}

function tandas<T>(lista: T[]): T[][] {
  return Array.from({ length: Math.ceil(lista.length / TANDA) }, (_, i) =>
    lista.slice(i * TANDA, (i + 1) * TANDA),
  );
}

type Destino = { local: string; cajaId: string; canalId: string };

function filasDeLaTanda(destino: Destino, tanda: VentaDeEjemplo[]) {
  const conId = tanda.map((venta) => ({ venta, id: crypto.randomUUID() }));
  const ventas = conId.map(({ venta, id }) => ({
    id,
    local_id: destino.local,
    origen: 'mostrador' as const,
    fecha: venta.fecha,
    cerrada_en: venta.cerradaEn,
    total_centavos: venta.totalCentavos,
    canal_id: destino.canalId,
    clave: crypto.randomUUID(),
    en_la_caja: true,
    creado_por: destino.cajaId,
  }));
  return { conId, ventas };
}

type ConId = { venta: VentaDeEjemplo; id: string }[];

// Los renglones de cada venta, ya con el id de su venta.
const renglonesDe = (local: string, conId: ConId) =>
  conId.flatMap(({ venta, id }) =>
    venta.renglones.map((r) => ({
      local_id: local,
      venta_id: id,
      producto_id: r.productoId,
      presentacion_id: r.presentacionId,
      descripcion: r.descripcion,
      cantidad: r.cantidad,
      precio_unitario_centavos: r.precioCentavos,
      subtotal_centavos: r.precioCentavos * r.cantidad,
    })),
  );

const pagosDe = (local: string, conId: ConId) =>
  conId.flatMap(({ venta, id }) =>
    venta.pagos.map((p) => ({
      local_id: local,
      venta_id: id,
      medio: p.medio,
      monto_centavos: p.montoCentavos,
    })),
  );

/**
 * Las ventas de días pasados van directo, con la clave secreta: la función del mostrador guarda
 * siempre con la fecha de hoy. Quedan a nombre de la caja de ejemplo.
 */
export async function escribirVentas(secreto: Cliente, destino: Destino, ventas: VentaDeEjemplo[]) {
  for (const tanda of tandas(ventas)) {
    const { conId, ventas: filas } = filasDeLaTanda(destino, tanda);
    comprobar((await secreto.from('ventas').insert(filas)).error, 'escribir las ventas');
    const renglones = renglonesDe(destino.local, conId);
    comprobar(
      (await secreto.from('renglones_de_venta').insert(renglones)).error,
      'escribir los renglones',
    );
    const pagos = pagosDe(destino.local, conId);
    comprobar((await secreto.from('pagos_de_venta').insert(pagos)).error, 'escribir los pagos');
  }
}

/** Cada cierre lo carga la caja de ejemplo, con la misma función que la pantalla. */
export async function escribirCierres(caja: Cliente, cierres: CierreDeEjemplo[]): Promise<void> {
  for (const cierre of cierres) {
    comprobar(
      (await caja.rpc('cierres_guardar', { datos: cierre })).error,
      `cerrar el ${cierre.fecha}`,
    );
  }
}

/** Los días que el local no abrió, marcados por el admin de ejemplo como en el control. */
export async function marcarSinAbrir(admin: Cliente, dias: string[]): Promise<void> {
  for (const dia of dias) {
    const { error } = await admin.rpc('cierres_marcar_sin_abrir', { la_fecha: dia, marcar: true });
    comprobar(error, `marcar que no abrió el ${dia}`);
  }
}

/** Los proveedores de ejemplo que falten, cargados por el admin de ejemplo. */
export async function escribirProveedores(admin: Cliente, local: string): Promise<void> {
  const ya = await idsPorNombre(admin, 'proveedores', local);
  const nuevos = PROVEEDORES_DE_EJEMPLO.filter((p) => !ya.has(p.nombre)).map((p) => ({ ...p }));
  comprobar((await admin.from('proveedores').insert(nuevos)).error, 'cargar los proveedores');
}

/** Los gastos de ejemplo, cargados por el admin de ejemplo: los controlan las reglas de Gastos. */
export async function escribirGastos(admin: Cliente, local: string, gastos: GastoDeEjemplo[]) {
  const [categorias, proveedores] = await Promise.all([
    idsPorNombre(admin, 'categorias_de_gasto', local),
    idsPorNombre(admin, 'proveedores', local),
  ]);
  const filas = gastos.map(({ categoria, proveedor, ...gasto }) => ({
    ...gasto,
    categoria_id: categorias.get(categoria)!,
    proveedor_id: proveedor ? proveedores.get(proveedor)! : null,
  }));
  for (const tanda of tandas(filas)) {
    comprobar((await admin.from('gastos').insert(tanda)).error, 'cargar los gastos');
  }
}
