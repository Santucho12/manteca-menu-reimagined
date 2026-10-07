'use server';

import { fallo, type Resultado } from '@/lib/resultado';
import { crearClienteDelServidor } from '@/lib/supabase/servidor';
import { registrar } from '@/lib/usuarios/cuentas';
import { MENSAJES } from '@/lib/usuarios/errores';
import { esquemaRegistro } from '@/lib/usuarios/esquemas';

export async function registrarse(datos: unknown): Promise<Resultado> {
  const validos = esquemaRegistro.safeParse(datos);
  if (!validos.success) return fallo(MENSAJES.datosInvalidos);
  return registrar(await crearClienteDelServidor(), validos.data);
}
