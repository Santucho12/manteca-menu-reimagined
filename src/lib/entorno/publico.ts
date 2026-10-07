import { z } from 'zod';
import { validarEntorno } from './validar';

const esquema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

/** Variables que tambien viajan al navegador. */
export function leerEntornoPublico(): z.infer<typeof esquema> {
  // Se nombran una por una porque Next.js solo las reemplaza si las ve escritas asi.
  return validarEntorno(esquema, {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
