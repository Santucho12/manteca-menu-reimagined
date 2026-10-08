import { readFileSync } from 'node:fs';
import { afterAll, describe, expect, it } from 'vitest';
import {
  cambiosDelAumento,
  leerMenuPublico,
  leerPanel,
  localDeQuienPide,
} from '../../src/lib/menu/consultas';
import { aplicarAumento, desactivar, guardarCategoria } from '../../src/lib/menu/escritura';
import { subirFoto } from '../../src/lib/menu/subida';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import { clienteSecretoDePruebas } from '../clientes';
import { borrarMenuDePrueba, filaDe, sembrarCategoria, sembrarProducto } from '../menu-de-prueba';
import { clienteComo } from '../sesiones';

const creadas: string[] = [];
const subidas: string[] = [];
afterAll(async () => {
  await borrarMenuDePrueba(creadas);
  if (subidas.length > 0)
    await clienteSecretoDePruebas().storage.from('fotos-del-menu').remove(subidas);
});

async function sembrar(...args: Parameters<typeof sembrarCategoria>) {
  const categoria = await sembrarCategoria(...args);
  creadas.push(categoria.id);
  return categoria;
}

describe('lecturas del menu', () => {
  it('el admin lee su panel con precios y origen; caja no lee nada', async () => {
    const categoria = await sembrar({ compartidos: [300000] });
    const producto = await sembrarProducto(categoria, { precios: [null] });
    const panel = await leerPanel(await clienteComo('admin'));
    const encontrada = panel.find((c) => c.id === categoria.id);
    expect(encontrada?.productos[0]).toMatchObject({ id: producto.id, conPrecio: true });
    expect(encontrada?.productos[0]?.precios[0]?.origen).toBe('compartido');
    expect(await leerPanel(await clienteComo('caja'))).toEqual([]);
  });

  it('el visitante lee el menu publico armado', async () => {
    const categoria = await sembrar({ compartidos: [300000] });
    await sembrarProducto(categoria, { precios: [null] });
    const menu = await leerMenuPublico(crearClienteSinSesion());
    expect(menu.find((c) => c.id === categoria.id)?.subtitulo).toBe('Unidad $3.000');
  });

  it('la vista previa del aumento marca los ocultos', async () => {
    const categoria = await sembrar();
    await sembrarProducto(categoria, { visible: false, precios: [500000] });
    const cambios = await cambiosDelAumento(await clienteComo('admin'), {
      categoriaId: categoria.id,
      porcentaje: '10',
      redondeo: '10000',
    });
    expect(cambios).toEqual([
      expect.objectContaining({ montoCentavos: 500000, nuevoCentavos: 550000, oculto: true }),
    ]);
  });
});

describe('escrituras del menu', () => {
  it('guardar algo que oculta productos pide confirmar y despues los oculta', async () => {
    const categoria = await sembrar({ compartidos: [300000] });
    const producto = await sembrarProducto(categoria, { precios: [null] });
    const datos = {
      id: categoria.id,
      nombre: categoria.nombre,
      subtitulo: '',
      icono: '🥐' as const,
      foto: '',
      precioCompartido: false,
      presentaciones: [{ id: categoria.presentaciones[0]!.id, nombre: 'Unidad', compartido: '' }],
    };
    const admin = await clienteComo('admin');
    expect(await guardarCategoria(admin, datos, false)).toEqual({
      ok: true,
      datos: { estado: 'confirmar', productos: [producto.nombre] },
    });
    expect(await guardarCategoria(admin, datos, true)).toMatchObject({
      ok: true,
      datos: { estado: 'guardado', ocultados: [producto.nombre] },
    });
  });

  it('desactivar una categoria con productos explica cuales', async () => {
    const categoria = await sembrar();
    const producto = await sembrarProducto(categoria);
    expect(
      await desactivar(await clienteComo('admin'), { tipo: 'categoria', id: categoria.id }),
    ).toEqual({
      ok: false,
      mensaje: `Primero mové o desactivá estos productos: ${producto.nombre}.`,
    });
  });

  it('el aumento calcula el precio nuevo en el servidor', async () => {
    const categoria = await sembrar({ compartidos: [300000] });
    const cambios = await cambiosDelAumento(await clienteComo('admin'), {
      categoriaId: categoria.id,
      porcentaje: '10',
      redondeo: '10000',
    });
    const precio = cambios[0]!;
    const datos = {
      categoriaId: categoria.id,
      porcentaje: '10',
      redondeo: '10000' as const,
      precios: [{ id: precio.id, antesCentavos: 300000 }],
    };
    expect(await aplicarAumento(await clienteComo('admin'), datos)).toEqual({
      ok: true,
      datos: { cantidad: 1 },
    });
    expect((await filaDe('precios', precio.id)).monto_centavos).toBe(330000);
  });

  it('caja no guarda categorias', async () => {
    const datos = {
      id: '',
      nombre: 'X',
      subtitulo: '',
      icono: '🥐' as const,
      foto: '',
      precioCompartido: false,
      presentaciones: [{ id: '', nombre: 'Unidad', compartido: '' }],
    };
    expect(await guardarCategoria(await clienteComo('caja'), datos, false)).toEqual({
      ok: false,
      mensaje: 'Eso ya cambió o no está disponible. Recargá la página e intentá de nuevo.',
    });
  });
});

describe('subirFoto', () => {
  const archivo = (tipo: string) =>
    new File([readFileSync('e2e/archivos/foto-de-prueba.jpg')], 'foto.jpg', { type: tipo });

  it('el admin sube a la carpeta de su local y recibe la ruta', async () => {
    const admin = await clienteComo('admin');
    const resultado = await subirFoto(admin, await localDeQuienPide(admin), archivo('image/jpeg'));
    if (!resultado.ok) throw new Error(resultado.mensaje);
    subidas.push(resultado.datos);
    expect(resultado.datos).toMatch(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/);
  });

  it('caja no sube y un PDF no se acepta', async () => {
    const admin = await clienteComo('admin');
    const local = await localDeQuienPide(admin);
    expect((await subirFoto(await clienteComo('caja'), local, archivo('image/jpeg'))).ok).toBe(
      false,
    );
    expect(await subirFoto(admin, local, archivo('application/pdf'))).toEqual({
      ok: false,
      mensaje: 'Subí una foto JPG, PNG o WebP.',
    });
  });
});
