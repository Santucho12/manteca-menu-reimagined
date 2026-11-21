import type { Cliente } from '@/lib/supabase/cliente';
import { catalogoParaVender, porArmar } from '@/lib/vender/consultas';
import { productosParaArmar } from '@/lib/vender/surtidas';
import { vueltoDeLaDireccion } from '@/lib/ventas/edicion';

type Parametros = Record<string, string | string[] | undefined>;

/** Lo que trae la ventana al cobrar: el vuelto y las surtidas de esa venta para armar (pedido 102). */
export async function datosDeLaVentana(cliente: Cliente, parametros: Parametros) {
  const efectivoCentavos = vueltoDeLaDireccion(parametros.vuelto);
  const armar = typeof parametros.armar === 'string' ? parametros.armar : null;
  if (!armar) return { efectivoCentavos };
  const [todas, catalogo] = await Promise.all([porArmar(cliente), catalogoParaVender(cliente)]);
  const pendientes = todas.filter((p) => p.ventaId === armar);
  const productos = Object.fromEntries(
    pendientes.map((p) => [p.categoriaId, productosParaArmar(catalogo, p.categoriaId)]),
  );
  return { efectivoCentavos, pendientes, productos };
}
