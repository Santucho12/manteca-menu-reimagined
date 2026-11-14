'use server';

import { ejecutarAccion } from '@/lib/acceso/servidor';
import { anularCierre, cambiarTolerancia, editarCierre, guardarCierre } from '@/lib/caja/escritura';
import {
  centavosDeCaja,
  esquemaAnulacionDeCierre,
  esquemaCierre,
  esquemaEdicion,
  esquemaSinAbrir,
  esquemaTolerancia,
} from '@/lib/caja/esquemas';
import { marcarSinAbrir } from '@/lib/caja/sinAbrir';

// Caja y Admin: el cierre queda a nombre de quien tiene la sesion, la base no deja elegir.
export async function guardarCierreDesdeElPanel(datos: unknown) {
  return ejecutarAccion('caja', esquemaCierre, datos, ({ cliente }, cierre) =>
    guardarCierre(cliente, cierre),
  );
}

// Solo el admin corrige un cierre guardado: Caja podria acomodarlo despues de ver la diferencia.
export async function editarCierreDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', esquemaEdicion, datos, ({ cliente }, { id, ...cierre }) =>
    editarCierre(cliente, id, cierre),
  );
}

export async function anularCierreDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', esquemaAnulacionDeCierre, datos, ({ cliente }, { id, motivo }) =>
    anularCierre(cliente, id, motivo),
  );
}

// Solo el admin dice que el local no abrio un dia, o lo deshace.
export async function marcarSinAbrirDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', esquemaSinAbrir, datos, ({ cliente }, { fecha, marcar }) =>
    marcarSinAbrir(cliente, fecha, marcar),
  );
}

export async function cambiarToleranciaDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', esquemaTolerancia, datos, ({ cliente }, { tolerancia }) =>
    cambiarTolerancia(cliente, centavosDeCaja(tolerancia)!),
  );
}
