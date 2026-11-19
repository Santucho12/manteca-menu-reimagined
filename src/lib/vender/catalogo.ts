import { claveDe, type ItemDelCatalogo, type RenglonDelTicket } from './ticket';

/** Lo que devuelve catalogo_para_vender: una fila por producto y forma de venta, en orden. */
export type FilaDelCatalogo = {
  categoria_id: string;
  categoria: string;
  producto_id: string;
  producto: string;
  presentacion_id: string;
  presentacion: string;
  precio_centavos: number;
};

export type ProductoParaVender = { id: string; nombre: string; formas: ItemDelCatalogo[] };
export type CategoriaParaVender = { id: string; nombre: string; productos: ProductoParaVender[] };

const formaDe = (f: FilaDelCatalogo): ItemDelCatalogo => ({
  productoId: f.producto_id,
  presentacionId: f.presentacion_id,
  nombre: f.producto,
  presentacion: f.presentacion,
  precioCentavos: f.precio_centavos,
});

function productoDe(categoria: CategoriaParaVender, f: FilaDelCatalogo): ProductoParaVender {
  const previo = categoria.productos.find((p) => p.id === f.producto_id);
  if (previo) return previo;
  const nuevo = { id: f.producto_id, nombre: f.producto, formas: [] };
  categoria.productos.push(nuevo);
  return nuevo;
}

/** Las categorías con sus productos y las formas de venta de cada uno, en el orden del menú. */
export function catalogoDeFilas(filas: FilaDelCatalogo[]): CategoriaParaVender[] {
  const categorias: CategoriaParaVender[] = [];
  for (const f of filas) {
    let categoria = categorias.find((c) => c.id === f.categoria_id);
    if (!categoria) {
      categoria = { id: f.categoria_id, nombre: f.categoria, productos: [] };
      categorias.push(categoria);
    }
    productoDe(categoria, f).formas.push(formaDe(f));
  }
  return categorias;
}

/** El ticket con los precios que rigen hoy; lo que ya no se vende sale. */
export function preciosAlDia(
  ticket: RenglonDelTicket[],
  catalogo: CategoriaParaVender[],
): RenglonDelTicket[] {
  const formas = catalogo.flatMap((c) => c.productos.flatMap((p) => p.formas));
  return ticket.flatMap((renglon) => {
    const forma = formas.find((f) => claveDe(f) === claveDe(renglon));
    return forma ? [{ ...renglon, precioCentavos: forma.precioCentavos }] : [];
  });
}
