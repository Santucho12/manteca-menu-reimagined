import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { afterAll, describe, expect, it } from 'vitest';
import type { Cliente } from '../../src/lib/supabase/cliente';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import { clienteSecretoDePruebas } from '../clientes';
import { asegurarLocalB, idDelLocalPrincipal } from '../locales';
import { clienteComo } from '../sesiones';

const BUCKET = 'fotos-del-menu';
const FOTO = readFileSync('e2e/archivos/foto-de-prueba.jpg');
const subidas: string[] = [];

async function subir(cliente: Cliente, carpeta: string, tipo = 'image/jpeg') {
  const ruta = `${carpeta}/${randomUUID()}.jpg`;
  const { error } = await cliente.storage.from(BUCKET).upload(ruta, FOTO, { contentType: tipo });
  if (!error) subidas.push(ruta);
  return error;
}

const localPrincipal = () => idDelLocalPrincipal(clienteSecretoDePruebas());

afterAll(async () => {
  if (subidas.length > 0) await clienteSecretoDePruebas().storage.from(BUCKET).remove(subidas);
});

describe('fotos del menu', () => {
  it('el admin activo sube una foto a la carpeta de su local', async () => {
    expect(await subir(await clienteComo('admin'), await localPrincipal())).toBeNull();
  });

  it('el admin no sube a la carpeta de otro local', async () => {
    const otro = await asegurarLocalB(clienteSecretoDePruebas());
    expect(await subir(await clienteComo('admin'), otro)).not.toBeNull();
  });

  it.each(['caja', 'invitado', 'encargado', 'desactivado'] as const)(
    '%s no sube fotos',
    async (rol) => {
      expect(await subir(await clienteComo(rol), await localPrincipal())).not.toBeNull();
    },
  );

  it('el visitante no sube fotos', async () => {
    expect(await subir(crearClienteSinSesion(), await localPrincipal())).not.toBeNull();
  });

  it('solo acepta imagenes', async () => {
    const admin = await clienteComo('admin');
    expect(await subir(admin, await localPrincipal(), 'application/pdf')).not.toBeNull();
  });

  it('cualquiera ve una foto subida, sin sesion', async () => {
    await subir(await clienteComo('admin'), await localPrincipal());
    const { data } = crearClienteSinSesion().storage.from(BUCKET).getPublicUrl(subidas.at(-1)!);
    expect((await fetch(data.publicUrl)).status).toBe(200);
  });
});
