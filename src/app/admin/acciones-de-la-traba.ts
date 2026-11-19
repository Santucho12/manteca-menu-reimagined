'use server';

import { exigirAccion } from '@/lib/acceso/servidor';
import { fallo, type Resultado } from '@/lib/resultado';
import type { EstadoDelTurno } from '@/lib/caja/turnos';
import { estadoDelMostrador } from '@/lib/vender/consultas';
import { postergarCierre } from '@/lib/vender/escritura';

/** El estado del mostrador para quien vende; sin revalidar el panel, porque se pregunta seguido. */
export async function leerEstadoDelMostrador(): Promise<EstadoDelTurno | null> {
  const acceso = await exigirAccion('caja');
  return acceso.ok ? estadoDelMostrador(acceso.datos.cliente) : null;
}

/** Diez minutos más para el cierre que traba el mostrador; la sesión decide quién posterga. */
export async function postergarDesdeElMostrador(): Promise<Resultado<{ hasta: string }>> {
  const acceso = await exigirAccion('caja');
  if (!acceso.ok) return fallo(acceso.mensaje);
  return postergarCierre(acceso.datos.cliente);
}
