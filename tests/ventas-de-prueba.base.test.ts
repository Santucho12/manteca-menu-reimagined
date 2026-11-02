import { describe, expect, it } from 'vitest';
import { clienteSecretoDePruebas } from './clientes';
import { sembrarVentaConRenglones } from './reportes-de-prueba';
import { borrarVentas, productoParaVender, sembrarVentaConPago } from './ventas-de-prueba';

// La auditoria de un renglon o de un pago lleva su propio id, no el de la venta.
async function hijosDe(ventas: string[]): Promise<string[]> {
  const secreto = clienteSecretoDePruebas();
  const [renglones, pagos] = await Promise.all([
    secreto.from('renglones_de_venta').select('id').in('venta_id', ventas),
    secreto.from('pagos_de_venta').select('id').in('venta_id', ventas),
  ]);
  return [...(renglones.data ?? []), ...(pagos.data ?? [])].map((fila) => String(fila.id));
}

async function auditoriaDe(ids: string[]): Promise<number> {
  const { count } = await clienteSecretoDePruebas()
    .from('auditoria')
    .select('id', { count: 'exact', head: true })
    .in('registro_id', ids);
  return count ?? -1;
}

describe('borrarVentas', () => {
  it('no deja en la auditoría los renglones ni los pagos de las ventas que borra', async () => {
    const producto = await productoParaVender();
    const ventas = await Promise.all([
      sembrarVentaConPago({ fecha: '2003-03-03', medio: 'efectivo', centavos: 1000 }),
      sembrarVentaConRenglones({
        fecha: '2003-03-03',
        renglones: [{ producto, cantidad: 1, precioCentavos: 1000 }],
      }),
    ]);
    const hijos = await hijosDe(ventas);
    expect(await auditoriaDe(hijos)).toBeGreaterThan(0);
    await borrarVentas(ventas, { categoriasDelMenu: [producto.categoriaId] });
    expect(await auditoriaDe([...ventas, ...hijos])).toBe(0);
  });
});
