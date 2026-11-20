// Verificacion funcional, Cierres de caja, lente 6 (reversa y propagacion): ver
// docs/verificacion-panel.md, hallazgo #5. Sacar el .skip para verificar el fix.
import { afterAll, describe, expect, it } from 'vitest';
import { diaEnArgentina } from '../../src/lib/fechas';
import { clienteSecretoDePruebas } from '../clientes';
import { SiembraDeCompras } from '../compras-de-prueba';
import { clienteComo } from '../sesiones';

const siembra = new SiembraDeCompras();
afterAll(() => siembra.borrar());

describe('verificacion · cierre anulado con un gasto que era una compra', () => {
  it.skip('#5 · anular el cierre tambien saca del costo la compra armada sobre su gasto', async () => {
    const proveedor = await siembra.proveedor();
    const forma = await siembra.forma(proveedor.id);
    const gasto = await siembra.gastoDeCaja(5_000, diaEnArgentina(new Date()));
    const admin = await clienteComo('admin');
    const { data: compraId } = await admin.rpc('compras_desde_gasto', {
      datos: {
        gasto_id: gasto.id,
        proveedor_id: proveedor.id,
        renglones: [{ forma_de_compra_id: forma.id, cantidad: 1, precio_unitario_centavos: 5_000 }],
      },
    });
    const cierreId = siembra.cierres[0]!;
    const { error } = await admin
      .from('cierres_de_caja')
      .update({ anulado: true, motivo_anulacion: 'Verificacion' })
      .eq('id', cierreId);
    expect(error).toBeNull();
    const secreto = clienteSecretoDePruebas();
    const { data: elGasto } = await secreto
      .from('gastos')
      .select('anulado')
      .eq('id', gasto.id)
      .single();
    expect(elGasto?.anulado).toBe(true);
    const { data: compra } = await secreto
      .from('compras')
      .select('anulado')
      .eq('id', compraId!)
      .single();
    // La plata de esa compra ya no existe: la compra no deberia seguir dando el precio.
    expect(compra?.anulado).toBe(true);
    const { data: costos } = await admin.rpc('costo_de_insumos');
    expect(costos?.find((c) => c.insumo_id === forma.insumoId)?.origen).toBe('referencia');
  });
});
