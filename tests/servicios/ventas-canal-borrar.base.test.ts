import { afterAll, describe, expect, it } from 'vitest';
import { borrarCanal, MENSAJES_DE_VENTAS } from '../../src/lib/ventas/escritura';
import { clienteSecretoDePruebas } from '../clientes';
import { clienteComo } from '../sesiones';
import { borrarVentas, sembrarCanal, sembrarVenta } from '../ventas-de-prueba';

const ventas: string[] = [];
const canales: string[] = [];

afterAll(() => borrarVentas(ventas, { canales }));

describe('borrarCanal', () => {
  it('borra un canal que nunca se uso', async () => {
    const canal = await sembrarCanal();
    canales.push(canal.id);
    expect(await borrarCanal(await clienteComo('admin'), canal.id)).toEqual({
      ok: true,
      datos: undefined,
    });
  });

  it('un canal con ventas dice que se desactive', async () => {
    const canal = await sembrarCanal();
    canales.push(canal.id);
    const venta = await sembrarVenta();
    ventas.push(venta.id);
    await clienteSecretoDePruebas()
      .from('ventas')
      .update({ canal_id: canal.id })
      .eq('id', venta.id);
    expect(await borrarCanal(await clienteComo('admin'), canal.id)).toEqual({
      ok: false,
      mensaje: MENSAJES_DE_VENTAS.canalConVentas,
    });
  });

  it('caja no borra canales', async () => {
    const canal = await sembrarCanal();
    canales.push(canal.id);
    expect(await borrarCanal(await clienteComo('caja'), canal.id)).toEqual({
      ok: false,
      mensaje: MENSAJES_DE_VENTAS.sinPermiso,
    });
  });
});
