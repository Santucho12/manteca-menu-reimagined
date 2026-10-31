import { afterAll, describe, expect, it } from 'vitest';
import { fondosAnteriores, fondosDelRango } from '../../src/lib/caja/consultas';
import { borrarCierres, diaLibre, diaSiguiente, sembrarCierre } from '../cierres-de-prueba';
import { clienteComo } from '../sesiones';

const cierres: string[] = [];

afterAll(() => borrarCierres(cierres), 30_000);

// Uno antes del rango y tres adentro; el del medio lo cargo el admin y no Caja.
async function sembrarCuatroDias() {
  const primero = diaLibre();
  const sembrados = await Promise.all([
    sembrarCierre({ fecha: primero, quedaEnCajaCentavos: 300000 }),
    sembrarCierre({ fecha: diaSiguiente(primero), quedaEnCajaCentavos: 410000 }),
    sembrarCierre({
      fecha: diaSiguiente(primero, 2),
      cargadoPor: 'admin',
      quedaEnCajaCentavos: 520000,
    }),
    sembrarCierre({ fecha: diaSiguiente(primero, 3) }),
  ]);
  cierres.push(...sembrados.map((cierre) => cierre.id));
  return sembrados.slice(1);
}

describe('fondosDelRango', () => {
  it('da lo mismo que cierres_fondos_anteriores, y el anterior puede ser de otra persona', async () => {
    const delRango = await sembrarCuatroDias();
    const admin = await clienteComo('admin');
    const fondos = await fondosDelRango(admin, delRango[0]!.fecha, delRango[2]!.fecha);
    const ids = delRango.map((cierre) => cierre.id);
    const esperados = await fondosAnteriores(admin, ids);
    expect(ids.map((id) => fondos.get(id))).toEqual(ids.map((id) => esperados.get(id)));
    expect(ids.map((id) => fondos.get(id))).toEqual([300000, 410000, 520000]);
  });
});
