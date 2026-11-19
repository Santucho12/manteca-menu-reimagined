'use server';

import { ejecutarAccion } from '@/lib/acceso/servidor';
import { guardarVentaDelMostrador } from '@/lib/vender/escritura';
import { esquemaVentaDelMostrador } from '@/lib/vender/esquemas';

/** Caja o el admin cobran en el mostrador: la venta queda a nombre de la sesión. */
export async function venderDesdeElMostrador(datos: unknown) {
  return ejecutarAccion('caja', esquemaVentaDelMostrador, datos, ({ cliente }, venta) =>
    guardarVentaDelMostrador(cliente, venta),
  );
}
