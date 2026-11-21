import type { Cliente } from '../supabase/cliente';
import { vistaPrevia, type CambioDePrecio, type RedondeoCentavos } from './aumento';
import type { DatosDeAumento } from './esquemas';
import { alcanceDelAumento, armarPanel, type CategoriaDelPanel, type FilasDelMenu } from './panel';
import { leerFilas, menuPublico, type CategoriaPublica } from './publico';

type Respuesta<T> = { data: T | null; error: { message: string } | null };

function datosDe<T>(respuesta: Respuesta<T>, que: string): T {
  if (respuesta.error) throw new Error(`No pudimos leer ${que}: ${respuesta.error.message}`);
  return respuesta.data as T;
}

// El menu de un local es chico (decenas de filas): se lee entero, sin paginar.
/** Todo el menu del local, activo o no. RLS se lo deja leer solo al admin activo. */
export async function leerFilasDelMenu(cliente: Cliente): Promise<FilasDelMenu> {
  const [categorias, presentaciones, productos, precios] = await Promise.all([
    cliente.from('categorias').select('id, nombre, subtitulo, foto, icono, orden, visible, activo'),
    cliente
      .from('presentaciones')
      .select('id, categoria_id, nombre, orden, activo, unidades, gramos'),
    cliente
      .from('productos')
      .select('id, categoria_id, nombre, descripcion, etiqueta, orden, visible, activo'),
    cliente.from('precios').select('id, presentacion_id, producto_id, monto_centavos, activo'),
  ]);
  return {
    categorias: datosDe(categorias, 'las categorias'),
    presentaciones: datosDe(presentaciones, 'las presentaciones'),
    productos: datosDe(productos, 'los productos'),
    precios: datosDe(precios, 'los precios'),
  };
}

export async function leerPanel(cliente: Cliente): Promise<CategoriaDelPanel[]> {
  return armarPanel(await leerFilasDelMenu(cliente));
}

export async function leerMenuPublico(cliente: Cliente): Promise<CategoriaPublica[]> {
  const respuesta = await cliente.from('menu_publico').select('*');
  return menuPublico(leerFilas(datosDe(respuesta, 'el menu')));
}

/** Lo que va a cambiar un aumento, calculado en el servidor sobre los precios de la base. */
export async function cambiosDelAumento(
  cliente: Cliente,
  datos: DatosDeAumento,
): Promise<CambioDePrecio[]> {
  const alcance = alcanceDelAumento(await leerFilasDelMenu(cliente), datos.categoriaId || null);
  return vistaPrevia(alcance, Number(datos.porcentaje), Number(datos.redondeo) as RedondeoCentavos);
}

/** La carpeta donde el admin puede subir fotos es la de su local. */
export async function localDeQuienPide(cliente: Cliente): Promise<string> {
  const { data, error } = await cliente.rpc('local_del_usuario');
  if (error || !data)
    throw new Error(`No pudimos saber el local: ${error?.message ?? 'sin local'}`);
  return data;
}
