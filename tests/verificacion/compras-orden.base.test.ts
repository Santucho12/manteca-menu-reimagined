// Verificacion funcional, Compras, hallazgo #8: ver docs/verificacion-panel.md.
// Arriba van los pedidos por recibir; un pedido anulado no se cuela entre ellos.
import { afterAll, describe, expect, it } from 'vitest';
import { listarCompras } from '../../src/lib/compras/consultas';
import { diaEnArgentina } from '../../src/lib/fechas';
import { SiembraDeCompras, unaClave } from '../compras-de-prueba';
import { clienteComo } from '../sesiones';

const siembra = new SiembraDeCompras();
afterAll(() => siembra.borrar());

describe('verificacion · compras · orden de la lista', () => {
  it('#8 · los pedidos por recibir van primero y el anulado al final', async () => {
    const proveedor = await siembra.proveedor();
    const forma = await siembra.forma(proveedor.id);
    const admin = await clienteComo('admin');
    const pedir = async () =>
      (
        await admin.rpc('compras_pedir', {
          datos: {
            proveedor_id: proveedor.id,
            clave: unaClave(),
            renglones: [{ forma_de_compra_id: forma.id, cantidad: 1 }],
          },
        })
      ).data!;
    // El anulado es el mas nuevo: por fecha de carga quedaria primero.
    const vigente = await pedir();
    const anulado = await pedir();
    await admin.rpc('compras_anular', { la_compra: anulado, motivo: 'No va' });
    const hoy = diaEnArgentina(new Date());
    const filtros = { estado: 'todas' as const, proveedor: proveedor.id, desde: hoy, hasta: hoy };
    const ids = (await listarCompras(admin, filtros)).map((c) => c.id);
    expect(ids).toEqual([vigente, anulado]);
  });
});
