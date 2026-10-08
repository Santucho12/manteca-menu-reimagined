import { describe, expect, it } from 'vitest';
import { crearClienteSinSesion } from './sin-sesion';

describe('crearClienteSinSesion', () => {
  it('arranca sin sesion', async () => {
    const { data } = await crearClienteSinSesion().auth.getSession();
    expect(data.session).toBeNull();
  });
});
