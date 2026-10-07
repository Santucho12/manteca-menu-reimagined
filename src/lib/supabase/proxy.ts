import { createServerClient, type SetAllCookies } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { requiereSesion } from '../acceso/estados';
import { leerEntornoPublico } from '../entorno/publico';
import type { Database } from './tipos';

type Salida = { respuesta: NextResponse };

// Las cookies renovadas van al pedido (para lo que se arme despues) y a la respuesta (para el
// navegador). Las cabeceras evitan que una cache guarde la sesion de otra persona.
function renovarEn(pedido: NextRequest, salida: Salida): SetAllCookies {
  return (galletas, cabeceras) => {
    galletas.forEach(({ name, value }) => pedido.cookies.set(name, value));
    salida.respuesta = NextResponse.next({ request: pedido });
    galletas.forEach(({ name, value, options }) =>
      salida.respuesta.cookies.set(name, value, options),
    );
    Object.entries(cabeceras).forEach(([clave, valor]) =>
      salida.respuesta.headers.set(clave, valor),
    );
  };
}

function clienteDelPedido(pedido: NextRequest, salida: Salida) {
  const entorno = leerEntornoPublico();
  return createServerClient<Database>(
    entorno.NEXT_PUBLIC_SUPABASE_URL,
    entorno.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { cookies: { getAll: () => pedido.cookies.getAll(), setAll: renovarEn(pedido, salida) } },
  );
}

function alIngreso(pedido: NextRequest): NextResponse {
  const destino = pedido.nextUrl.clone();
  destino.pathname = '/admin/ingresar';
  destino.search = '';
  return NextResponse.redirect(destino);
}

/** Refresca la sesion vencida y manda al ingreso a quien pide el panel sin sesion. */
export async function actualizarSesion(pedido: NextRequest): Promise<NextResponse> {
  const salida: Salida = { respuesta: NextResponse.next({ request: pedido }) };
  const supabase = clienteDelPedido(pedido, salida);
  // Nada entre crear el cliente y getClaims: es lo que refresca una sesion vencida.
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims && requiereSesion(pedido.nextUrl.pathname)) return alIngreso(pedido);
  return salida.respuesta;
}
