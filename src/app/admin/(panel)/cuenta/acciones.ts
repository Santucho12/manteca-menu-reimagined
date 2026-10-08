'use server';

import { ejecutarAccion } from '@/lib/acceso/servidor';
import type { Resultado } from '@/lib/resultado';
import { cambiarContrasena } from '@/lib/usuarios/cuentas';
import { esquemaCambioDeContrasena } from '@/lib/usuarios/esquemas';

export async function cambiarMiContrasena(datos: unknown): Promise<Resultado> {
  return ejecutarAccion('cuenta', esquemaCambioDeContrasena, datos, ({ cliente }, validos) =>
    cambiarContrasena(cliente, validos),
  );
}
