'use server';

import { ejecutarAccion } from '@/lib/acceso/servidor';
import type { Resultado } from '@/lib/resultado';
import { crearClienteSecreto } from '@/lib/supabase/secreto';
import {
  asignarRol,
  corregir,
  desactivar,
  reactivar,
  resetearContrasena,
  type DatosDeTemporal,
} from '@/lib/usuarios/administracion';
import { esquemaAsignarRol, esquemaCorreccion, esquemaCuenta } from '@/lib/usuarios/esquemas';

// La clave secreta se arma recien despues de que ejecutarAccion comprobo que pide un admin
// activo; el servicio lo vuelve a comprobar antes de usarla.

export async function darRol(datos: unknown): Promise<Resultado> {
  return ejecutarAccion('admin', esquemaAsignarRol, datos, ({ cliente }, validos) =>
    asignarRol(cliente, validos),
  );
}

export async function desactivarCuenta(datos: unknown): Promise<Resultado> {
  return ejecutarAccion('admin', esquemaCuenta, datos, ({ cliente }, { id }) =>
    desactivar(cliente, crearClienteSecreto(), id),
  );
}

export async function reactivarCuenta(datos: unknown): Promise<Resultado> {
  return ejecutarAccion('admin', esquemaCuenta, datos, ({ cliente }, { id }) =>
    reactivar(cliente, crearClienteSecreto(), id),
  );
}

export async function resetearContrasenaDe(datos: unknown): Promise<Resultado<DatosDeTemporal>> {
  return ejecutarAccion('admin', esquemaCuenta, datos, ({ cliente }, { id }) =>
    resetearContrasena(cliente, crearClienteSecreto(), id),
  );
}

export async function corregirCuenta(datos: unknown): Promise<Resultado> {
  return ejecutarAccion('admin', esquemaCorreccion, datos, ({ cliente }, validos) =>
    corregir(cliente, crearClienteSecreto(), validos),
  );
}
