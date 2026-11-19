import { randomUUID } from 'node:crypto';
import { borrarCierres, sembrarCierre } from './cierres-de-prueba';
import { clienteSecretoDePruebas } from './clientes';
import { idDelLocalPrincipal } from './locales';
import { borrarInsumos, sembrarFormaDeCompra, sembrarInsumo } from './materia-prima-de-prueba';
import { borrarProveedores, sembrarProveedor } from './proveedores-de-prueba';

export type RenglonDeCompra = {
  forma_de_compra_id: string;
  cantidad: number;
  precio_unitario_centavos?: number;
};

/** Lo que crea una prueba de compras, para borrarlo al final en el orden que piden las FK. */
export class SiembraDeCompras {
  insumos: string[] = [];
  proveedores: string[] = [];
  gastos: string[] = [];
  cierres: string[] = [];

  async proveedor(semilla: Parameters<typeof sembrarProveedor>[0] = {}) {
    const proveedor = await sembrarProveedor(semilla);
    this.proveedores.push(proveedor.id);
    return proveedor;
  }

  /** Un insumo en gramos con la bolsa de 25 kg de este proveedor ($32.000 de referencia). */
  async forma(proveedorId: string | null, otroLocal = false) {
    const insumo = await sembrarInsumo({ otroLocal });
    this.insumos.push(insumo.id);
    const id = await sembrarFormaDeCompra({
      insumoId: insumo.id,
      localId: insumo.local_id,
      proveedorId,
    });
    return { id, insumoId: insumo.id };
  }

  async borrar() {
    await borrarComprasDe(this.proveedores);
    const secreto = clienteSecretoDePruebas();
    await secreto.from('gastos').delete().in('id', this.gastos);
    await secreto.from('auditoria').delete().in('registro_id', this.gastos);
    await borrarCierres(this.cierres);
    await borrarInsumos(this.insumos);
    await borrarProveedores(this.proveedores);
  }

  /** Un gasto de caja "Sin clasificar", como el que deja un cierre, de este monto. */
  async gastoDeCaja(montoCentavos: number, fecha: string) {
    const local = await idDelLocalPrincipal(clienteSecretoDePruebas());
    const cierre = await sembrarCierre();
    this.cierres.push(cierre.id);
    const sinClasificar = await sinClasificarDe(local);
    const { data, error } = await clienteSecretoDePruebas()
      .from('gastos')
      .insert(filaDeCaja(local, cierre.id, sinClasificar, montoCentavos, fecha))
      .select('id')
      .single();
    if (error) throw new Error(`No pude sembrar el gasto de caja: ${error.message}`);
    this.gastos.push(data.id);
    return { id: data.id, sinClasificar };
  }
}

function filaDeCaja(
  local: string,
  cierre: string,
  categoria: string,
  monto: number,
  fecha: string,
) {
  return {
    local_id: local,
    fecha,
    categoria_id: categoria,
    monto_centavos: monto,
    medio_de_pago: 'efectivo_caja' as const,
    cierre_id: cierre,
    descripcion: 'Harina',
  };
}

async function sinClasificarDe(local: string): Promise<string> {
  const { data } = await clienteSecretoDePruebas()
    .from('categorias_de_gasto')
    .select('id')
    .eq('local_id', local)
    .eq('nombre', 'Sin clasificar')
    .single();
  return data!.id;
}

export const unaClave = () => randomUUID();

async function ids(tabla: 'compras' | 'renglones_de_compra', columna: string, valores: string[]) {
  const { data } = await clienteSecretoDePruebas().from(tabla).select('id').in(columna, valores);
  return (data ?? []).map((fila) => fila.id);
}

async function idsDe(tabla: 'gastos' | 'gastos_por_pagar', compras: string[]) {
  const { data } = await clienteSecretoDePruebas()
    .from(tabla)
    .select('id')
    .in('compra_id', compras);
  return (data ?? []).map((fila) => fila.id);
}

/** Borra las compras de estos proveedores con sus renglones, sus gastos, lo por pagar y la auditoria. */
export async function borrarComprasDe(proveedores: string[]): Promise<void> {
  if (proveedores.length === 0) return;
  const secreto = clienteSecretoDePruebas();
  const compras = await ids('compras', 'proveedor_id', proveedores);
  const renglones = await ids('renglones_de_compra', 'compra_id', compras);
  const gastos = await idsDe('gastos', compras);
  const porPagar = await idsDe('gastos_por_pagar', compras);
  await secreto.from('renglones_de_compra').delete().in('compra_id', compras);
  await secreto.from('compras').update({ gasto_id: null, por_pagar_id: null }).in('id', compras);
  await secreto.from('gastos').delete().in('por_pagar_id', porPagar);
  await secreto.from('gastos').delete().in('id', gastos);
  await secreto.from('gastos_por_pagar').delete().in('id', porPagar);
  await secreto.from('compras').delete().in('id', compras);
  const todos = [...compras, ...renglones, ...gastos, ...porPagar];
  await secreto.from('auditoria').delete().in('registro_id', todos);
}
