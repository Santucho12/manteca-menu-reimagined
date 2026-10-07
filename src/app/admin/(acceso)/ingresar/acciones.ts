'use server';

import { fallo, type Resultado } from '@/lib/resultado';
import { crearClienteDelServidor } from '@/lib/supabase/servidor';
import { ingresar } from '@/lib/usuarios/cuentas';
import { MENSAJES } from '@/lib/usuarios/errores';
import { esquemaIngreso } from '@/lib/usuarios/esquemas';

export async function ingresarAlPanel(datos: unknown): Promise<Resultado> {
  const validos = esquemaIngreso.safeParse(datos);
  if (!validos.success) return fallo(MENSAJES.datosInvalidos);
  return ingresar(await crearClienteDelServidor(), validos.data);
}
