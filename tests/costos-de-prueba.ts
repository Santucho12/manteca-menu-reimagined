import { clienteSecretoDePruebas } from './clientes';
import { borrarInsumos, sembrarFormaDeCompra, sembrarInsumo } from './materia-prima-de-prueba';
import {
  borrarMenuDePrueba,
  sembrarCategoria,
  sembrarProducto,
  type CategoriaSembrada,
} from './menu-de-prueba';
import type { UnidadDeUso } from './materia-prima-de-prueba';

export type Renglon = { insumo_id: string; cantidad: number };
export type DatosDeReceta = {
  producto_id: string;
  presentacion_id?: string | null;
  rinde?: number;
  desperdicio_porcentaje?: number;
  renglones: Renglon[];
};

/** Lo que crea una prueba de costos, para borrarlo al final en el orden que piden las FK. */
export class SiembraDeCostos {
  categorias: string[] = [];
  insumos: string[] = [];

  /** Una categoria con Unidad y Docena y un producto con precio propio en las dos. */
  async menu(precios: (number | null)[] = [100_000, 1_000_000]) {
    const categoria = await sembrarCategoria({ presentaciones: ['Unidad', 'Docena'] });
    this.categorias.push(categoria.id);
    const producto = await sembrarProducto(categoria, { precios });
    return { categoria, producto };
  }

  /** Un insumo con una forma de compra: precio en centavos por el contenido. */
  async insumo(precioCentavos: number | null, contenido = 1, unidad: UnidadDeUso = 'g') {
    const insumo = await sembrarInsumo({ unidad });
    this.insumos.push(insumo.id);
    await sembrarFormaDeCompra({
      insumoId: insumo.id,
      localId: insumo.local_id,
      contenido,
      precioCentavos,
    });
    return insumo;
  }

  async borrar() {
    await borrarCostosDe(this.categorias);
    await borrarMenuDePrueba(this.categorias);
    await borrarInsumos(this.insumos);
  }
}

/** Las unidades y el agregado de una presentacion, sin pasar por la pantalla. */
export async function sembrarUnidades(
  categoria: CategoriaSembrada,
  indice: number,
  unidades: number,
  agregadoCentavos = 0,
) {
  const { error } = await clienteSecretoDePruebas().from('costos_de_presentacion').insert({
    local_id: categoria.localId,
    presentacion_id: categoria.presentaciones[indice]!.id,
    unidades,
    agregado_centavos: agregadoCentavos,
  });
  if (error) throw new Error(`No pude sembrar las unidades: ${error.message}`);
}

async function idsDe(tabla: 'productos' | 'presentaciones', categorias: string[]) {
  const { data } = await clienteSecretoDePruebas()
    .from(tabla)
    .select('id')
    .in('categoria_id', categorias);
  return (data ?? []).map((fila) => fila.id);
}

async function idsDondeEsta(
  tabla: 'recetas' | 'renglones_de_receta' | 'costos_de_presentacion',
  columna: string,
  valores: string[],
) {
  const { data } = await clienteSecretoDePruebas().from(tabla).select('id').in(columna, valores);
  return (data ?? []).map((fila) => fila.id);
}

/** Borra recetas, renglones y unidades de estas categorias, con su auditoria. */
export async function borrarCostosDe(categorias: string[]): Promise<void> {
  if (categorias.length === 0) return;
  const secreto = clienteSecretoDePruebas();
  const presentaciones = await idsDe('presentaciones', categorias);
  const recetas = await idsDondeEsta(
    'recetas',
    'producto_id',
    await idsDe('productos', categorias),
  );
  const renglones = await idsDondeEsta('renglones_de_receta', 'receta_id', recetas);
  const unidades = await idsDondeEsta('costos_de_presentacion', 'presentacion_id', presentaciones);
  await secreto.from('renglones_de_receta').delete().in('id', renglones);
  await secreto.from('recetas').delete().in('id', recetas);
  await secreto.from('costos_de_presentacion').delete().in('id', unidades);
  await secreto
    .from('auditoria')
    .delete()
    .in('registro_id', [...recetas, ...renglones, ...unidades]);
}
