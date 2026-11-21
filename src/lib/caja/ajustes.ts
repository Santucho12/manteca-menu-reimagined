import { z } from 'zod';
import { esquemaTolerancia } from './esquemas';
import { esquemaDeHoras } from './turnos';

/** Horas de cierre y diferencia aceptada en un solo formulario, con las reglas de cada parte. */
export const esquemaDeAjustes = z
  .object({ mediodia: z.string(), noche: z.string(), tolerancia: z.string() })
  .superRefine((datos, contexto) => {
    const partes = [esquemaDeHoras.safeParse(datos), esquemaTolerancia.safeParse(datos)];
    for (const parte of partes) {
      for (const problema of parte.error?.issues ?? []) {
        contexto.addIssue({ code: 'custom', message: problema.message, path: problema.path });
      }
    }
  });

export type AjustesDeCaja = z.infer<typeof esquemaDeAjustes>;
