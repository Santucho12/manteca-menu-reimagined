import { describe, expect, inject, it } from 'vitest';
import { clienteComo } from './sesiones';

describe('sesiones de prueba', () => {
  it('clienteComo reutiliza el cliente de cada rol', async () => {
    expect(await clienteComo('caja')).toBe(await clienteComo('caja'));
  });

  it('clienteComo usa la sesion que abrio la preparacion, sin volver a ingresar', async () => {
    const { data } = await (await clienteComo('admin')).auth.getSession();
    expect(data.session?.access_token).toBe(inject('sesionesDePrueba').admin.access_token);
  });
});
