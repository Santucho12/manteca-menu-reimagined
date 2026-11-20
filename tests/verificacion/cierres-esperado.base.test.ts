// Verificacion funcional, Cierres de caja, lente 3 (numeros y bordes): ver
// docs/verificacion-panel.md. Lo esperado de cada medio, contra las ventas sembradas a mano:
// cada turno con lo suyo, sin lo anulado ni lo cancelado.
import { afterAll, describe, expect, it } from 'vitest';
import { borrarCierres, sembrarCierre } from '../cierres-de-prueba';
import { clienteComo } from '../sesiones';
import { borrarVentas, sembrarVentaConPago } from '../ventas-de-prueba';

const ventas: string[] = [];
const cierres: string[] = [];
afterAll(async () => {
  await borrarVentas(ventas);
  await borrarCierres(cierres);
});

async function vender(
  fecha: string,
  venta: Omit<Parameters<typeof sembrarVentaConPago>[0], 'fecha'>,
) {
  ventas.push(await sembrarVentaConPago({ fecha, ...venta }));
}

describe('verificacion · cierres · lo esperado', () => {
  it('cada turno espera lo suyo, por medio, sin anuladas ni canceladas', async () => {
    const noche = await sembrarCierre({ turno: 2 });
    const mediodia = await sembrarCierre({ fecha: noche.fecha, turno: 1 });
    cierres.push(noche.id, mediodia.id);
    const fecha = noche.fecha;
    await vender(fecha, { medio: 'efectivo', centavos: 1_000_000, turno: 2 });
    await vender(fecha, { medio: 'qr', centavos: 200_000, turno: 2 });
    await vender(fecha, { medio: 'efectivo', centavos: 500_000, turno: 2, anulada: true });
    await vender(fecha, { medio: 'efectivo', centavos: 300_000, turno: 2, estado: 'cancelada' });
    await vender(fecha, { medio: 'efectivo', centavos: 700_000, turno: 1 });
    const { data, error } = await (
      await clienteComo('admin')
    ).rpc('cierres_con_resultado', {
      desde: fecha,
      hasta: fecha,
      persona: null,
    } as never);
    expect(error).toBeNull();
    const de = (id: string) => data!.find((c) => c.id === id)!;
    expect(de(noche.id)).toMatchObject({
      ventas_efectivo_centavos: 1_000_000,
      ventas_qr_centavos: 200_000,
    });
    expect(de(mediodia.id)).toMatchObject({
      ventas_efectivo_centavos: 700_000,
      ventas_qr_centavos: 0,
    });
  });
});
