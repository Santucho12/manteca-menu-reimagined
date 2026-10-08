import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import { clienteSecretoDePruebas } from '../clientes';
import {
  borrarMenuDePrueba,
  sembrarCategoria,
  sembrarProducto,
  type CategoriaSembrada,
  type ProductoSembrado,
} from '../menu-de-prueba';
import { clienteComo } from '../sesiones';

let visible: CategoriaSembrada;
let oculta: CategoriaSembrada;
let otroLocal: CategoriaSembrada;
const productos: Record<string, ProductoSembrado> = {};

beforeAll(async () => {
  visible = await sembrarCategoria({
    presentaciones: ['Mediano', 'Grande'],
    compartidos: [null, 400000],
  });
  oculta = await sembrarCategoria({ visible: false });
  otroLocal = await sembrarCategoria({ otroLocal: true });
  productos.conPrecio = await sembrarProducto(visible, {
    precios: [350000, null],
    etiqueta: 'mas_vendido',
  });
  productos.oculto = await sembrarProducto(visible, { visible: false });
  productos.desactivado = await sembrarProducto(visible, { activo: false });
  productos.deOculta = await sembrarProducto(oculta);
  productos.deOtroLocal = await sembrarProducto(otroLocal);
});

afterAll(() => borrarMenuDePrueba([visible.id, oculta.id, otroLocal.id]));

async function filasSinSesion() {
  const { data, error } = await crearClienteSinSesion().from('menu_publico').select('*');
  expect(error).toBeNull();
  return data ?? [];
}

describe('menu_publico', () => {
  it('el visitante ve el producto visible con sus precios y el compartido', async () => {
    const fila = (await filasSinSesion()).find((f) => f.producto_id === productos.conPrecio!.id);
    expect(fila).toMatchObject({
      categoria: visible.nombre,
      etiqueta: 'mas_vendido',
      compartidos: [{ presentacion: 'Grande', monto_centavos: 400000 }],
      precios: [
        { presentacion: 'Mediano', monto_centavos: 350000, compartido: false },
        { presentacion: 'Grande', monto_centavos: 400000, compartido: true },
      ],
    });
  });

  it('no trae lo oculto, lo desactivado, lo de una categoria oculta ni lo de otro local', async () => {
    const ids = (await filasSinSesion()).map((f) => f.producto_id);
    for (const clave of ['oculto', 'desactivado', 'deOculta', 'deOtroLocal']) {
      expect(ids, clave).not.toContain(productos[clave]!.id);
    }
  });

  it('no trae un producto que se quedo sin precio aunque este visible', async () => {
    await clienteSecretoDePruebas()
      .from('precios')
      .update({ activo: false })
      .in(
        'presentacion_id',
        visible.presentaciones.map((p) => p.id),
      );
    const ids = (await filasSinSesion()).map((f) => f.producto_id);
    expect(ids).not.toContain(productos.conPrecio!.id);
    await clienteSecretoDePruebas()
      .from('precios')
      .update({ activo: true })
      .in(
        'presentacion_id',
        visible.presentaciones.map((p) => p.id),
      );
  });

  it('trae solo las columnas publicas', async () => {
    const [fila] = await filasSinSesion();
    expect(Object.keys(fila!).sort()).toEqual([
      'categoria',
      'categoria_id',
      'compartidos',
      'descripcion',
      'etiqueta',
      'foto',
      'icono',
      'nombre',
      'orden',
      'orden_categoria',
      'precios',
      'producto_id',
      'subtitulo',
    ]);
  });

  it('tambien la lee alguien con sesion', async () => {
    const { data, error } = await (
      await clienteComo('caja')
    )
      .from('menu_publico')
      .select('producto_id');
    expect(error).toBeNull();
    expect((data ?? []).map((f) => f.producto_id)).toContain(productos.conPrecio!.id);
  });
});
