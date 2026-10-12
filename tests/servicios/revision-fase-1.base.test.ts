import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { fondosAnteriores } from '../../src/lib/caja/consultas';
import type { DatosDeGasto } from '../../src/lib/gastos/esquemas';
import { crearGasto, MENSAJES_DE_GASTOS } from '../../src/lib/gastos/escritura';
import { borrarCierres, sembrarCierre } from '../cierres-de-prueba';
import { clienteSecretoDePruebas } from '../clientes';
import { borrarGastos, idDeCategoria } from '../gastos-de-prueba';
import { clienteComo } from '../sesiones';

const gastos: string[] = [];
const cierres: string[] = [];

afterAll(async () => {
  await borrarGastos({ gastos });
  await borrarCierres(cierres);
}, 30_000);

async function datos(cambios: Partial<DatosDeGasto> = {}): Promise<DatosDeGasto> {
  return {
    fecha: '2031-06-10',
    categoriaId: await idDeCategoria('Alquiler'),
    monto: '1.500,25',
    descripcion: '',
    proveedorId: '',
    medioDePago: 'transferencia',
    comprobante: '',
    ...cambios,
  };
}

describe('cargar un gasto dos veces', () => {
  it('con la misma clave devuelve el mismo gasto y no lo duplica', async () => {
    const admin = await clienteComo('admin');
    const clave = randomUUID();
    const primero = await crearGasto(admin, await datos({ clave }));
    const segundo = await crearGasto(admin, await datos({ clave }));
    expect(primero.ok && segundo.ok).toBe(true);
    if (primero.ok) gastos.push(primero.datos.id);
    expect(segundo.ok && primero.ok && segundo.datos.id === primero.datos.id).toBe(true);
    const { data } = await clienteSecretoDePruebas().from('gastos').select('id').eq('clave', clave);
    expect(data).toHaveLength(1);
  });

  it('con el efectivo de la caja explica que sale por el cierre', async () => {
    const admin = await clienteComo('admin');
    const resultado = await crearGasto(admin, await datos({ medioDePago: 'efectivo_caja' }));
    expect(resultado).toEqual({ ok: false, mensaje: MENSAJES_DE_GASTOS.efectivoDeCaja });
  });
});

describe('fondosAnteriores', () => {
  it('devuelve lo que quedo en el cierre anterior de cada uno', async () => {
    const antes = await sembrarCierre({ fecha: '1998-04-01', quedaEnCajaCentavos: 300000 });
    const despues = await sembrarCierre({ fecha: '1998-04-02' });
    cierres.push(antes.id, despues.id);
    const fondos = await fondosAnteriores(await clienteComo('admin'), [despues.id]);
    expect(fondos.get(despues.id)).toBe(300000);
    expect((await fondosAnteriores(await clienteComo('admin'), [])).size).toBe(0);
  });
});
