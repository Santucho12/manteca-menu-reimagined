import { z } from 'zod';
import { validarEntorno } from './validar';

const esquema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1),
});

/** Variables que nunca salen del servidor. */
export function leerEntornoServidor(): z.infer<typeof esquema> {
  return validarEntorno(esquema, {
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  });
}
