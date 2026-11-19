'use server';

import { z } from 'zod';
import { ejecutarAccion } from '@/lib/acceso/servidor';
import { esquemaMargenes, esquemaReceta, esquemaUnidades } from '@/lib/costos/esquemas';
import { guardarMargenes, guardarReceta, guardarUnidades } from '@/lib/costos/escritura';

export async function guardarRecetaDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', esquemaReceta, datos, ({ cliente }, receta) =>
    guardarReceta(cliente, receta),
  );
}

export async function guardarUnidadesDesdeElPanel(datos: unknown) {
  const esquema = esquemaUnidades.extend({ presentacionId: z.uuid() });
  return ejecutarAccion('admin', esquema, datos, ({ cliente }, { presentacionId, ...unidades }) =>
    guardarUnidades(cliente, presentacionId, unidades),
  );
}

export async function guardarMargenesDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', esquemaMargenes, datos, ({ cliente }, margenes) =>
    guardarMargenes(cliente, margenes),
  );
}
