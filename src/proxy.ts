import type { NextRequest } from 'next/server';
import { actualizarSesion } from './lib/supabase/proxy';

export function proxy(pedido: NextRequest) {
  return actualizarSesion(pedido);
}

// Solo el panel usa la sesion: el menu publico no pasa por aca.
export const config = { matcher: ['/admin/:path*'] };
