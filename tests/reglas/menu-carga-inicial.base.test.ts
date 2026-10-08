import { describe, expect, it } from 'vitest';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import { clienteSecretoDePruebas } from '../clientes';
import { idDelLocalPrincipal } from '../locales';

const CATEGORIAS = ['Facturas', 'Laminados', 'Panes', 'Clásicos', 'Cafetería', 'Extras'];

async function categoriasIniciales() {
  const secreto = clienteSecretoDePruebas();
  const { data } = await secreto
    .from('categorias')
    .select('id, nombre, foto, icono, subtitulo, orden')
    .eq('local_id', await idDelLocalPrincipal(secreto))
    .in('nombre', CATEGORIAS)
    .order('orden');
  return data ?? [];
}

describe('carga inicial del menu', () => {
  it('estan las 6 categorias de hoy, en orden, con su icono y su foto', async () => {
    const categorias = await categoriasIniciales();
    expect(categorias.map((c) => c.nombre)).toEqual(CATEGORIAS);
    expect(categorias.map((c) => c.icono)).toEqual(['🥐', '🧈', '🍞', '🥨', '☕', '➕']);
    expect(categorias[1]?.foto).toBe('/menu/laminados.jpeg');
    expect(categorias[5]?.foto).toBeNull();
  });

  it('el publico ve los 35 productos de hoy', async () => {
    const ids = (await categoriasIniciales()).map((c) => c.id);
    const { data } = await crearClienteSinSesion()
      .from('menu_publico')
      .select('nombre, categoria_id')
      .in('categoria_id', ids);
    expect(data).toHaveLength(35);
  });

  it('Facturas tiene precio compartido y la Medialuna es la mas vendida', async () => {
    const { data } = await crearClienteSinSesion()
      .from('menu_publico')
      .select('*')
      .eq('nombre', 'Medialuna');
    expect(data?.[0]).toMatchObject({
      etiqueta: 'mas_vendido',
      compartidos: [
        { presentacion: 'Docena', monto_centavos: 2000000 },
        { presentacion: 'Media docena', monto_centavos: 1200000 },
        { presentacion: 'Unidad', monto_centavos: 300000 },
      ],
    });
  });

  it('el Capuccino tiene solo Grande', async () => {
    const { data } = await crearClienteSinSesion()
      .from('menu_publico')
      .select('precios')
      .eq('nombre', 'Capuccino');
    expect(data?.[0]?.precios).toEqual([
      { presentacion: 'Mediano', monto_centavos: null, compartido: true },
      { presentacion: 'Grande', monto_centavos: 610000, compartido: false },
    ]);
  });
});
