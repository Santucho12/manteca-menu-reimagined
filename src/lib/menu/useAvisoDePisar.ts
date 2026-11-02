import { useState } from 'react';
import type { DatosDeProducto } from './esquemas';
import { preciosQuePisan, type PrecioQuePisa } from './pisar';
import type { OpcionDeCategoria } from './usePreciosSegunCategoria';

type Pendiente = { datos: DatosDeProducto; categoria: string; precios: PrecioQuePisa[] };

/**
 * Antes de guardar un producto, mira si algun precio nuevo pisa el de su categoria: si es asi,
 * lo deja pendiente para preguntar; si no, guarda directo (pedido 82).
 */
export function useAvisoDePisar(
  opciones: OpcionDeCategoria[],
  guardar: (datos: DatosDeProducto) => unknown,
) {
  const [pendiente, setPendiente] = useState<Pendiente | null>(null);
  const revisar = (datos: DatosDeProducto) => {
    const categoria = opciones.find((opcion) => opcion.id === datos.categoriaId);
    const precios = categoria ? preciosQuePisan(datos.precios, categoria) : [];
    if (!categoria || precios.length === 0) return guardar(datos);
    setPendiente({ datos, categoria: categoria.nombre, precios });
  };
  const confirmar = () => {
    if (!pendiente) return;
    setPendiente(null);
    return guardar(pendiente.datos);
  };
  return { pendiente, revisar, confirmar, volver: () => setPendiente(null) };
}
