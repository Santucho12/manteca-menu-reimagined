import type { z } from 'zod';

/** Valida variables de entorno y, si alguna falta, dice cuales. */
export function validarEntorno<T extends z.ZodType>(
  esquema: T,
  valores: Record<string, string | undefined>,
): z.infer<T> {
  const resultado = esquema.safeParse(valores);
  if (resultado.success) return resultado.data;
  const nombres = [...new Set(resultado.error.issues.map((problema) => problema.path.join('.')))];
  throw new Error(
    `Faltan o están mal estas variables de entorno: ${nombres.join(', ')}. ` +
      'En local se cargan en .env.local (ver .env.example).',
  );
}
