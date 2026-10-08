import { afterAll, describe, expect, it } from 'vitest';
import { idDeCuentaDePrueba, registrosDe } from '../consultas-de-prueba';
import type { RolDePrueba } from '../cuentas';
import { borrarMenuDePrueba, filaDe, sembrarCategoria, sembrarProducto } from '../menu-de-prueba';
import { clienteComo } from '../sesiones';

type Tipo = 'categoria' | 'producto';
const creadas: string[] = [];
afterAll(() => borrarMenuDePrueba(creadas));

async function sembrar(...args: Parameters<typeof sembrarCategoria>) {
  const categoria = await sembrarCategoria(...args);
  creadas.push(categoria.id);
  return categoria;
}

async function llamar(rol: RolDePrueba, funcion: string, args: Record<string, unknown>) {
  const { error } = await (await clienteComo(rol)).rpc(funcion as 'menu_mover', args as never);
  return error;
}

const visibilidad = (rol: RolDePrueba, el_tipo: Tipo, el_id: string, mostrar: boolean) =>
  llamar(rol, 'menu_cambiar_visibilidad', { el_tipo, el_id, mostrar });

describe('menu_cambiar_visibilidad', () => {
  it('oculta y muestra un producto, y queda en la auditoria', async () => {
    const producto = await sembrarProducto(await sembrar());
    expect(await visibilidad('admin', 'producto', producto.id, false)).toBeNull();
    expect((await filaDe('productos', producto.id)).visible).toBe(false);
    expect(await visibilidad('admin', 'producto', producto.id, true)).toBeNull();
    const admin = await idDeCuentaDePrueba('admin');
    expect(await registrosDe(producto.id)).toContainEqual(
      expect.objectContaining({ accion: 'cambio', usuario_id: admin, despues: { visible: false } }),
    );
  });

  it('no muestra un producto sin precio', async () => {
    const producto = await sembrarProducto(await sembrar(), { visible: false, precios: [null] });
    expect((await visibilidad('admin', 'producto', producto.id, true))?.code).toBe('PM102');
    expect((await filaDe('productos', producto.id)).visible).toBe(false);
  });

  it('oculta y muestra una categoria', async () => {
    const categoria = await sembrar();
    expect(await visibilidad('admin', 'categoria', categoria.id, false)).toBeNull();
    expect((await filaDe('categorias', categoria.id)).visible).toBe(false);
  });

  it.each(['caja', 'invitado', 'adminOtroLocal'] as const)(
    '%s no cambia la visibilidad',
    async (rol) => {
      const categoria = await sembrar();
      expect((await visibilidad(rol, 'categoria', categoria.id, false))?.code).toBe('PM100');
      expect((await filaDe('categorias', categoria.id)).visible).toBe(true);
    },
  );
});

describe('menu_mover', () => {
  it('cambia el orden con el vecino y en el borde no hace nada', async () => {
    const categoria = await sembrar();
    const primero = await sembrarProducto(categoria);
    const segundo = await sembrarProducto(categoria);
    const antes = [
      (await filaDe('productos', primero.id)).orden,
      (await filaDe('productos', segundo.id)).orden,
    ];
    expect(
      await llamar('admin', 'menu_mover', {
        el_tipo: 'producto',
        el_id: segundo.id,
        direccion: 'arriba',
      }),
    ).toBeNull();
    expect((await filaDe('productos', segundo.id)).orden).toBe(antes[0]);
    expect((await filaDe('productos', primero.id)).orden).toBe(antes[1]);
    expect(
      await llamar('admin', 'menu_mover', {
        el_tipo: 'producto',
        el_id: segundo.id,
        direccion: 'arriba',
      }),
    ).toBeNull();
    expect((await filaDe('productos', segundo.id)).orden).toBe(antes[0]);
  });

  it('mueve categorias del local y la de otro local no', async () => {
    const primera = await sembrar();
    const segunda = await sembrar();
    const orden = (await filaDe('categorias', primera.id)).orden;
    expect(
      await llamar('admin', 'menu_mover', {
        el_tipo: 'categoria',
        el_id: segunda.id,
        direccion: 'arriba',
      }),
    ).toBeNull();
    expect((await filaDe('categorias', segunda.id)).orden).toBe(orden);
    expect(
      (
        await llamar('adminOtroLocal', 'menu_mover', {
          el_tipo: 'categoria',
          el_id: primera.id,
          direccion: 'abajo',
        })
      )?.code,
    ).toBe('PM100');
  });
});

describe('menu_desactivar y menu_reactivar', () => {
  it('no desactiva una categoria con productos activos y dice cuales', async () => {
    const categoria = await sembrar();
    const producto = await sembrarProducto(categoria);
    const error = await llamar('admin', 'menu_desactivar', {
      el_tipo: 'categoria',
      el_id: categoria.id,
    });
    expect(error?.code).toBe('PM103');
    expect(JSON.parse(error!.details)).toEqual([producto.nombre]);
  });

  it('desactiva un producto: deja de estar activo y visible, y queda en la auditoria', async () => {
    const producto = await sembrarProducto(await sembrar());
    expect(
      await llamar('admin', 'menu_desactivar', { el_tipo: 'producto', el_id: producto.id }),
    ).toBeNull();
    expect(await filaDe('productos', producto.id)).toMatchObject({ activo: false, visible: false });
    expect(await registrosDe(producto.id)).toContainEqual(
      expect.objectContaining({ accion: 'desactivacion' }),
    );
  });

  it('una categoria sin productos activos se desactiva y se reactiva oculta, ultima', async () => {
    const categoria = await sembrar();
    expect(
      await llamar('admin', 'menu_desactivar', { el_tipo: 'categoria', el_id: categoria.id }),
    ).toBeNull();
    const otra = await sembrar();
    expect(
      await llamar('admin', 'menu_reactivar', { el_tipo: 'categoria', el_id: categoria.id }),
    ).toBeNull();
    const fila = await filaDe('categorias', categoria.id);
    expect(fila).toMatchObject({ activo: true, visible: false });
    expect(fila.orden as number).toBeGreaterThan(
      (await filaDe('categorias', otra.id)).orden as number,
    );
  });

  it('no reactiva un producto si su categoria esta desactivada', async () => {
    const categoria = await sembrar();
    const producto = await sembrarProducto(categoria, { activo: false, visible: false });
    await llamar('admin', 'menu_desactivar', { el_tipo: 'categoria', el_id: categoria.id });
    expect(
      (await llamar('admin', 'menu_reactivar', { el_tipo: 'producto', el_id: producto.id }))?.code,
    ).toBe('PM104');
    expect((await filaDe('productos', producto.id)).activo).toBe(false);
  });

  it.each(['caja', 'encargado', 'desactivado'] as const)('%s no desactiva', async (rol) => {
    const producto = await sembrarProducto(await sembrar());
    expect(
      (await llamar(rol, 'menu_desactivar', { el_tipo: 'producto', el_id: producto.id }))?.code,
    ).toBe('PM100');
    expect((await filaDe('productos', producto.id)).activo).toBe(true);
  });
});
