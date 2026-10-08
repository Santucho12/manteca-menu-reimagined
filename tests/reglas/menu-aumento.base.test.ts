import { afterAll, describe, expect, it } from 'vitest';
import { clienteSecretoDePruebas } from '../clientes';
import { idDeCuentaDePrueba, registrosDe } from '../consultas-de-prueba';
import type { Json } from '../../src/lib/supabase/tipos';
import type { RolDePrueba } from '../cuentas';
import {
  borrarAumentos,
  borrarMenuDePrueba,
  filaDe,
  sembrarCategoria,
  sembrarProducto,
  type CategoriaSembrada,
} from '../menu-de-prueba';
import { clienteComo } from '../sesiones';

type PrecioActual = { id: string; monto_centavos: number };
const creadas: string[] = [];
afterAll(() => borrarMenuDePrueba(creadas));

async function sembrar(...args: Parameters<typeof sembrarCategoria>) {
  const categoria = await sembrarCategoria(...args);
  creadas.push(categoria.id);
  return categoria;
}

// Lo mismo que lee el servidor para la vista previa: los precios activos de la categoria,
// sin los de productos desactivados.
async function preciosDe(categoria: CategoriaSembrada): Promise<PrecioActual[]> {
  const secreto = clienteSecretoDePruebas();
  const presentaciones = categoria.presentaciones.map((p) => p.id);
  const { data } = await secreto
    .from('precios')
    .select('id, monto_centavos, productos(activo)')
    .in('presentacion_id', presentaciones)
    .eq('activo', true);
  return (data ?? [])
    .filter((fila) => fila.productos === null || fila.productos.activo)
    .map(({ id, monto_centavos }) => ({ id, monto_centavos }));
}

function aumentoDe(categoria: string | null, precios: PrecioActual[], porcentaje = 10) {
  return {
    porcentaje,
    redondeo_centavos: 10000,
    categoria_id: categoria,
    precios: precios.map((p) => ({
      id: p.id,
      antes_centavos: p.monto_centavos,
      despues_centavos: p.monto_centavos + 10000,
    })),
  };
}

async function aplicar(rol: RolDePrueba, datos: Json) {
  return (await clienteComo(rol)).rpc('menu_aplicar_aumento', { datos });
}

describe('menu_aplicar_aumento', () => {
  it('cambia el compartido y los propios, ocultos incluidos, y anota el aumento', async () => {
    const categoria = await sembrar({ compartidos: [300000] });
    await sembrarProducto(categoria, { visible: false, precios: [500000] });
    const precios = await preciosDe(categoria);
    expect(precios).toHaveLength(2);
    const { data, error } = await aplicar('admin', aumentoDe(categoria.id, precios));
    expect(error).toBeNull();
    for (const precio of precios) {
      expect((await filaDe('precios', precio.id)).monto_centavos).toBe(
        precio.monto_centavos + 10000,
      );
    }
    const admin = await idDeCuentaDePrueba('admin');
    expect(await filaDe('aumentos', data as string)).toMatchObject({
      porcentaje: 10,
      usuario_id: admin,
    });
    expect(await registrosDe(precios[0]!.id)).toContainEqual(
      expect.objectContaining({ accion: 'cambio', usuario_id: admin }),
    );
  });

  it('si un precio cambio desde la vista previa, rechaza todo', async () => {
    const categoria = await sembrar({ compartidos: [300000] });
    await sembrarProducto(categoria, { precios: [500000] });
    const precios = await preciosDe(categoria);
    await clienteSecretoDePruebas()
      .from('precios')
      .update({ monto_centavos: 700000 })
      .eq('id', precios[1]!.id);
    expect((await aplicar('admin', aumentoDe(categoria.id, precios))).error?.code).toBe('PM105');
    expect((await filaDe('precios', precios[0]!.id)).monto_centavos).toBe(
      precios[0]!.monto_centavos,
    );
  });

  it('si falta un precio del alcance o sobra uno, rechaza todo', async () => {
    const categoria = await sembrar({ compartidos: [300000] });
    await sembrarProducto(categoria, { precios: [500000] });
    const precios = await preciosDe(categoria);
    expect((await aplicar('admin', aumentoDe(categoria.id, precios.slice(1)))).error?.code).toBe(
      'PM105',
    );
    const duplicado = [...precios, precios[0]!];
    expect((await aplicar('admin', aumentoDe(categoria.id, duplicado))).error?.code).toBe('PM105');
  });

  it('todo el menu deja afuera los precios de productos desactivados', async () => {
    const categoria = await sembrar({ otroLocal: true });
    await sembrarProducto(categoria, { activo: false, visible: false, precios: [200000] });
    await sembrarProducto(categoria, { precios: [400000] });
    const precios = await preciosDe(categoria);
    expect(precios).toHaveLength(1);
    const { data, error } = await aplicar('adminOtroLocal', aumentoDe(null, precios));
    expect(error).toBeNull();
    // Sin categoria, la limpieza del menu no lo encuentra: se borra aparte.
    await borrarAumentos([data as string]);
    expect((await filaDe('precios', precios[0]!.id)).monto_centavos).toBe(410000);
  });

  it('rechaza un porcentaje fuera de los limites', async () => {
    const categoria = await sembrar({ compartidos: [300000] });
    const precios = await preciosDe(categoria);
    expect((await aplicar('admin', aumentoDe(categoria.id, precios, 300))).error?.code).toBe(
      '23514',
    );
  });

  it('no aumenta una categoria de otro local', async () => {
    const categoria = await sembrar({ compartidos: [300000] });
    const precios = await preciosDe(categoria);
    expect((await aplicar('adminOtroLocal', aumentoDe(categoria.id, precios))).error?.code).toBe(
      'PM106',
    );
  });

  it.each(['caja', 'invitado', 'desactivado'] as const)('%s no aplica aumentos', async (rol) => {
    const categoria = await sembrar({ compartidos: [300000] });
    const precios = await preciosDe(categoria);
    expect((await aplicar(rol, aumentoDe(categoria.id, precios))).error?.code).toBe('PM100');
  });
});
