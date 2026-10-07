import type { z } from 'zod';

/** Faltan variables de entorno. Lleva los nombres, para poder juntar los de varias lecturas. */
export class FaltanVariables extends Error {
  readonly nombres: string[];

  constructor(nombres: string[]) {
    super(
      `Faltan o están mal estas variables de entorno: ${nombres.join(', ')}. ` +
        'En local se cargan en .env.local (ver .env.example).',
    );
    this.name = 'FaltanVariables';
    this.nombres = nombres;
  }
}

/** Valida variables de entorno y, si alguna falta, dice cuales. */
export function validarEntorno<T extends z.ZodType>(
  esquema: T,
  valores: Record<string, string | undefined>,
): z.infer<T> {
  const resultado = esquema.safeParse(valores);
  if (resultado.success) return resultado.data;
  const nombres = resultado.error.issues.map((problema) => problema.path.join('.'));
  throw new FaltanVariables([...new Set(nombres)]);
}
