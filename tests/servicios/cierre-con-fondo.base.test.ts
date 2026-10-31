import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import {
  cierreConFondoAnterior,
  cierrePorId,
  misCierres,
  misCierresDeLaSesion,
} from '../../src/lib/caja/consultas';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import { borrarCierres, diaLibre, diaSiguiente, sembrarCierre } from '../cierres-de-prueba';
import { idDeCuentaDePrueba } from '../consultas-de-prueba';
import { clienteComo } from '../sesiones';

const cierres: string[] = [];

afterAll(() => borrarCierres(cierres), 30_000);

async function sembrar(...semillas: Parameters<typeof sembrarCierre>[0][]) {
  const sembrados = await Promise.all(semillas.map((semilla) => sembrarCierre(semilla)));
  cierres.push(...sembrados.map((cierre) => cierre.id));
  return sembrados;
}

describe('cierreConFondoAnterior', () => {
  it('trae el cierre con lo que quedó en el anterior', async () => {
    const dia = diaLibre();
    const [, despues] = await sembrar(
      { fecha: dia, quedaEnCajaCentavos: 300000 },
      { fecha: diaSiguiente(dia) },
    );
    const admin = await clienteComo('admin');
    const resultado = await cierreConFondoAnterior(admin, despues!.id);
    expect(resultado?.fondoAnteriorCentavos).toBe(300000);
    expect(resultado?.cierre).toEqual(await cierrePorId(admin, despues!.id));
  });

  it('un id que no existe da null', async () => {
    const admin = await clienteComo('admin');
    expect(await cierreConFondoAnterior(admin, randomUUID())).toBeNull();
    expect(await cierreConFondoAnterior(admin, 'no-es-un-id')).toBeNull();
  });

  it('Caja no ve el cierre de otra persona', async () => {
    const [ajeno] = await sembrar({ cargadoPor: 'admin' });
    expect(await cierreConFondoAnterior(await clienteComo('caja'), ajeno!.id)).toBeNull();
  });
});

describe('misCierresDeLaSesion', () => {
  it('da lo mismo que misCierres con el id de quien entra', async () => {
    await sembrar({ cargadoPor: 'caja' }, { cargadoPor: 'admin' });
    for (const rol of ['caja', 'admin'] as const) {
      const cliente = await clienteComo(rol);
      const esperados = await misCierres(cliente, await idDeCuentaDePrueba(rol));
      expect(await misCierresDeLaSesion(cliente)).toEqual(esperados);
    }
  });

  it('sin sesión no trae nada', async () => {
    expect(await misCierresDeLaSesion(crearClienteSinSesion())).toEqual([]);
  });
});
