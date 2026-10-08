import { describe, expect, it } from 'vitest';
import { clienteSecretoDePruebas } from './clientes';
import { clienteComo } from './sesiones';

// Dominio reservado que nunca resuelve: aunque la comprobacion fallara, no sale nada a otra base.
const URL_AJENA = 'https://otroproyecto.invalid';

async function conUrlAjena(accion: () => unknown): Promise<unknown> {
  const propia = process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = URL_AJENA;
  try {
    return await accion();
  } finally {
    // Asignar undefined dejaria el texto "undefined": si no habia valor, se borra.
    if (propia === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = propia;
  }
}

describe('clientes de los tests', () => {
  it('el cliente con la clave secreta no se arma si la base no es la de pruebas', async () => {
    await expect(conUrlAjena(() => clienteSecretoDePruebas())).rejects.toThrow(
      'no es la del proyecto de pruebas',
    );
  });

  it('clienteComo no inicia sesion si la base no es la de pruebas', async () => {
    await expect(conUrlAjena(() => clienteComo('admin'))).rejects.toThrow(
      'no es la del proyecto de pruebas',
    );
  });

  it('el cliente con la clave secreta se arma con la base de pruebas', async () => {
    const { error } = await clienteSecretoDePruebas().auth.admin.listUsers({ perPage: 1 });
    expect(error).toBeNull();
  });
});
