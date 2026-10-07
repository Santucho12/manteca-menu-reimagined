'use server';

import { ejecutarAccion } from '@/lib/acceso/servidor';
import type { Resultado } from '@/lib/resultado';
import { cambiarContrasenaObligada } from '@/lib/usuarios/cuentas';
import { esquemaCambioObligado } from '@/lib/usuarios/esquemas';

export async function guardarContrasenaNueva(datos: unknown): Promise<Resultado> {
  return ejecutarAccion(
    'cambiar-contrasena',
    esquemaCambioObligado,
    datos,
    ({ cliente }, validos) => cambiarContrasenaObligada(cliente, validos),
  );
}
