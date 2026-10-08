import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import { clienteSecretoDePruebas } from '../clientes';
import { idDeCuentaDePrueba, registrosDe } from '../consultas-de-prueba';
import type { RolDePrueba } from '../cuentas';
import {
  borrarMenuDePrueba,
  filaDe,
  nombreDePrueba,
  sembrarCategoria,
  sembrarProducto,
  type CategoriaSembrada,
} from '../menu-de-prueba';
import { clienteComo } from '../sesiones';

type Guardado = { id: string; ocultados: string[] };
const creadas: string[] = [];
afterAll(() => borrarMenuDePrueba(creadas));

async function sembrar(...args: Parameters<typeof sembrarCategoria>) {
  const categoria = await sembrarCategoria(...args);
  creadas.push(categoria.id);
  return categoria;
}

async function guardarCategoria(rol: RolDePrueba, datos: object, confirmar = false) {
  const respuesta = await (
    await clienteComo(rol)
  ).rpc('menu_guardar_categoria', {
    datos,
    confirmar,
  });
  if (respuesta.data) creadas.push((respuesta.data as Guardado).id);
  return respuesta;
}

async function guardarProducto(rol: RolDePrueba, datos: object, confirmar = false) {
  return (await clienteComo(rol)).rpc('menu_guardar_producto', { datos, confirmar });
}

function categoriaNueva(nombre = nombreDePrueba('Categoria')) {
  return {
    nombre,
    icono: '☕',
    presentaciones: [
      { nombre: 'Mediano' },
      { nombre: 'Grande', monto_compartido_centavos: 500000 },
    ],
  };
}

// La misma categoria, con solo las presentaciones que se nombran.
function conPresentaciones(categoria: CategoriaSembrada, cuantas: number) {
  return {
    id: categoria.id,
    nombre: categoria.nombre,
    icono: '🥐',
    presentaciones: categoria.presentaciones.slice(0, cuantas),
  };
}

describe('menu_guardar_categoria', () => {
  it('crea la categoria oculta, con sus presentaciones y su precio compartido', async () => {
    const { data, error } = await guardarCategoria('admin', categoriaNueva());
    expect(error).toBeNull();
    const { id } = data as Guardado;
    expect(await filaDe('categorias', id)).toMatchObject({ visible: false, icono: '☕' });
    const { data: presentaciones } = await clienteSecretoDePruebas()
      .from('presentaciones')
      .select('nombre, orden')
      .eq('categoria_id', id)
      .order('orden');
    expect(presentaciones).toEqual([
      { nombre: 'Mediano', orden: 0 },
      { nombre: 'Grande', orden: 1 },
    ]);
    const [alta] = await registrosDe(id);
    expect(alta).toMatchObject({ accion: 'alta', usuario_id: await idDeCuentaDePrueba('admin') });
  });

  it('guarda tal cual un nombre con comillas, porcentaje y emojis', async () => {
    const nombre = `"Don't" 100% 🥐 ${randomUUID().slice(0, 8)}`.padEnd(100, 'x');
    const { data, error } = await guardarCategoria('admin', categoriaNueva(nombre));
    expect(error).toBeNull();
    expect((await filaDe('categorias', (data as Guardado).id)).nombre).toBe(nombre);
  });

  it('renombrar una presentacion conserva sus precios', async () => {
    const categoria = await sembrar({ presentaciones: ['Mediano'], compartidos: [300000] });
    const [mediano] = categoria.presentaciones;
    const datos = {
      ...conPresentaciones(categoria, 0),
      presentaciones: [{ id: mediano.id, nombre: 'Chico', monto_compartido_centavos: 300000 }],
    };
    expect((await guardarCategoria('admin', datos)).error).toBeNull();
    expect(await filaDe('presentaciones', mediano.id)).toMatchObject({
      nombre: 'Chico',
      activo: true,
    });
  });

  it('sacar la presentacion de un producto visible pide confirmar y no aplica nada', async () => {
    const categoria = await sembrar({ presentaciones: ['Unidad', 'Docena'] });
    const producto = await sembrarProducto(categoria, { precios: [null, 900000] });
    const docena = categoria.presentaciones[1];
    const datos = conPresentaciones(categoria, 1);
    const { error } = await guardarCategoria('admin', datos);
    expect(error?.code).toBe('PM101');
    expect(JSON.parse(error!.details)).toEqual([producto.nombre]);
    expect((await filaDe('presentaciones', docena.id)).activo).toBe(true);
    const confirmado = await guardarCategoria('admin', datos, true);
    expect(confirmado.data).toMatchObject({ ocultados: [producto.nombre] });
    expect((await filaDe('productos', producto.id)).visible).toBe(false);
    expect((await filaDe('presentaciones', docena.id)).activo).toBe(false);
  });

  it('sacar el precio compartido oculta, con confirmacion, a los que lo heredaban', async () => {
    const categoria = await sembrar({ presentaciones: ['Unidad'], compartidos: [300000] });
    const producto = await sembrarProducto(categoria, { precios: [null] });
    const datos = conPresentaciones(categoria, 1);
    expect((await guardarCategoria('admin', datos)).error?.code).toBe('PM101');
    await guardarCategoria('admin', datos, true);
    expect((await filaDe('productos', producto.id)).visible).toBe(false);
  });

  it('acepta una foto de la carga inicial y rechaza una ruta cualquiera', async () => {
    const ok = await guardarCategoria('admin', {
      ...categoriaNueva(),
      foto: '/menu/facturas.jpg',
    });
    expect(ok.error).toBeNull();
    const mal = await guardarCategoria('admin', {
      ...categoriaNueva(),
      foto: 'https://otro.com/x.jpg',
    });
    expect(mal.error?.code).toBe('PM106');
  });

  it.each(['invitado', 'caja', 'encargado', 'desactivado'] as const)('%s no puede', async (rol) => {
    expect((await guardarCategoria(rol, categoriaNueva())).error?.code).toBe('PM100');
  });

  it('el admin de otro local no edita una categoria de este', async () => {
    const categoria = await sembrar();
    const datos = {
      ...conPresentaciones(categoria, 0),
      nombre: 'Robada',
      presentaciones: [{ nombre: 'Unidad' }],
    };
    expect((await guardarCategoria('adminOtroLocal', datos)).error?.code).toBe('PM100');
    expect((await filaDe('categorias', categoria.id)).nombre).toBe(categoria.nombre);
  });

  it('el visitante no puede llamarla', async () => {
    const { error } = await crearClienteSinSesion().rpc('menu_guardar_categoria', {
      datos: categoriaNueva(),
      confirmar: false,
    });
    expect(error?.code).toBe('42501');
  });
});

function productoNuevo(categoria: CategoriaSembrada, montos: (number | null)[], visible = true) {
  return {
    categoria_id: categoria.id,
    nombre: nombreDePrueba('Producto'),
    visible,
    precios: categoria.presentaciones.map((p, i) => ({
      presentacion_id: p.id,
      monto_centavos: montos[i] ?? null,
    })),
  };
}

describe('menu_guardar_producto', () => {
  it('crea un producto visible con su precio y su etiqueta', async () => {
    const categoria = await sembrar();
    const datos = { ...productoNuevo(categoria, [350000]), etiqueta: 'nuevo' };
    const { data, error } = await guardarProducto('admin', datos);
    expect(error).toBeNull();
    expect(await filaDe('productos', (data as Guardado).id)).toMatchObject({
      visible: true,
      etiqueta: 'nuevo',
    });
  });

  it('un producto visible sin precio pide confirmar; confirmado, queda oculto', async () => {
    const categoria = await sembrar();
    const datos = productoNuevo(categoria, [null]);
    expect((await guardarProducto('admin', datos)).error?.code).toBe('PM101');
    const { data } = await guardarProducto('admin', datos, true);
    expect(data).toMatchObject({ ocultados: [datos.nombre] });
    expect((await filaDe('productos', (data as Guardado).id)).visible).toBe(false);
  });

  it('sin precio propio hereda el compartido y puede estar visible', async () => {
    const categoria = await sembrar({ compartidos: [300000] });
    const { data, error } = await guardarProducto('admin', productoNuevo(categoria, [null]));
    expect(error).toBeNull();
    expect((await filaDe('productos', (data as Guardado).id)).visible).toBe(true);
  });

  it('pasarlo a una categoria donde no tiene precio pide confirmar', async () => {
    const origen = await sembrar();
    const destino = await sembrar({ presentaciones: ['Mediano', 'Grande'] });
    const producto = await sembrarProducto(origen);
    const datos = { ...productoNuevo(destino, []), id: producto.id, nombre: producto.nombre };
    expect((await guardarProducto('admin', datos)).error?.code).toBe('PM101');
    expect((await filaDe('productos', producto.id)).categoria_id).toBe(origen.id);
    await guardarProducto('admin', datos, true);
    expect(await filaDe('productos', producto.id)).toMatchObject({
      categoria_id: destino.id,
      visible: false,
    });
  });

  it('no lo pasa a una categoria desactivada ni usa presentaciones de otra', async () => {
    const activa = await sembrar();
    const apagada = await sembrar({ activo: false });
    const otra = await sembrar();
    const aApagada = { ...productoNuevo(apagada, []), visible: false, precios: [] };
    expect((await guardarProducto('admin', aApagada)).error?.code).toBe('PM106');
    const ajena = { ...productoNuevo(otra, [100000]), categoria_id: activa.id, visible: false };
    expect((await guardarProducto('admin', ajena)).error?.code).toBe('PM106');
  });

  it('rechaza un monto que no es de pesos enteros', async () => {
    const categoria = await sembrar();
    const datos = productoNuevo(categoria, [150], false);
    expect((await guardarProducto('admin', datos)).error?.code).toBe('23514');
  });

  it.each(['caja', 'adminOtroLocal'] as const)('%s no crea productos aca', async (rol) => {
    const categoria = await sembrar();
    const { error } = await guardarProducto(rol, productoNuevo(categoria, [], false));
    expect(['PM100', 'PM106']).toContain(error?.code);
  });
});
