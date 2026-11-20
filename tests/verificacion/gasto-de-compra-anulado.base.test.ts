// Verificacion funcional, Gastos, lente 6 (reversa y propagacion): ver
// docs/verificacion-panel.md, hallazgo #7. Sacar el .skip para verificar el fix.
import { afterAll, describe, expect, it } from 'vitest';
import { diaEnArgentina } from '../../src/lib/fechas';
import { anularGasto } from '../../src/lib/gastos/escritura';
import { clienteSecretoDePruebas } from '../clientes';
import { SiembraDeCompras, unaClave } from '../compras-de-prueba';
import { clienteComo } from '../sesiones';

const siembra = new SiembraDeCompras();
afterAll(() => siembra.borrar());

describe('verificacion · anular desde Gastos el gasto de una compra', () => {
  it('#7 · el gasto de una compra no se anula suelto: o se rechaza o anula la compra', async () => {
    const proveedor = await siembra.proveedor();
    const forma = await siembra.forma(proveedor.id);
    const hoy = diaEnArgentina(new Date());
    const admin = await clienteComo('admin');
    const { data: compraId } = await admin.rpc('compras_recibir', {
      datos: {
        proveedor_id: proveedor.id,
        fecha: hoy,
        clave: unaClave(),
        pago: { tipo: 'pagada', medio: 'transferencia', fecha: hoy },
        renglones: [
          { forma_de_compra_id: forma.id, cantidad: 1, precio_unitario_centavos: 2_500_000 },
        ],
      },
    });
    const secreto = clienteSecretoDePruebas();
    const { data: compra } = await secreto
      .from('compras')
      .select('gasto_id')
      .eq('id', compraId!)
      .single();
    const anulacion = await admin
      .from('gastos')
      .update({ anulado: true, motivo_anulacion: 'Verificacion' })
      .eq('id', compra!.gasto_id!);
    const { data: despues } = await secreto
      .from('compras')
      .select('anulado')
      .eq('id', compraId!)
      .single();
    // O el gasto no se deja anular solo, o la compra se anula con el.
    expect(anulacion.error !== null || despues?.anulado === true).toBe(true);
  });
});

describe('verificacion · el mensaje de Gastos', () => {
  it('anular desde Gastos el gasto de una compra explica que se anula la compra', async () => {
    const proveedor = await siembra.proveedor();
    const forma = await siembra.forma(proveedor.id);
    const hoy = diaEnArgentina(new Date());
    const admin = await clienteComo('admin');
    const { data: compraId } = await admin.rpc('compras_recibir', {
      datos: {
        proveedor_id: proveedor.id,
        fecha: hoy,
        clave: unaClave(),
        pago: { tipo: 'pagada', medio: 'transferencia', fecha: hoy },
        renglones: [{ forma_de_compra_id: forma.id, cantidad: 1, precio_unitario_centavos: 1_000 }],
      },
    });
    const { data: compra } = await clienteSecretoDePruebas()
      .from('compras')
      .select('gasto_id')
      .eq('id', compraId!)
      .single();
    expect(await anularGasto(admin, compra!.gasto_id!, 'Error')).toEqual({
      ok: false,
      mensaje: 'Es el gasto de una compra: anulá la compra desde Compras.',
    });
  });
});
