import { NextResponse, type NextRequest } from 'next/server';
import { crearClienteDelServidor } from '@/lib/supabase/servidor';
import { salir } from '@/lib/usuarios/cuentas';

// GET cuando el panel echa a una cuenta desactivada; POST desde el boton Salir.
async function cerrarSesion(pedido: NextRequest): Promise<NextResponse> {
  await salir(await crearClienteDelServidor());
  const destino = new URL('/admin/ingresar', pedido.url);
  if (pedido.nextUrl.searchParams.get('motivo') === 'desactivada') {
    destino.searchParams.set('motivo', 'desactivada');
  }
  // 303: despues de un POST, el navegador pide el ingreso con GET.
  return NextResponse.redirect(destino, 303);
}

export const GET = cerrarSesion;
export const POST = cerrarSesion;
