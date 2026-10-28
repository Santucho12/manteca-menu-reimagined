'use server';

import { ejecutarAccion } from '@/lib/acceso/servidor';
import { anularCierre, cambiarTolerancia, editarCierre, guardarCierre } from '@/lib/caja/escritura';
import {
  centavosDeCaja,
  esquemaAnulacionDeCierre,
  esquemaCierre,
  esquemaEdicion,
  esquemaTolerancia,
} from '@/lib/caja/esquemas';

// Caja y Admin: el cierre queda a nombre de quien tiene la sesion, la base no deja elegir.
export async function guardarCierreDesdeElPanel(datos: unknown) {
  return ejecutarAccion('caja', esquemaCierre, datos, ({ cliente }, cierre) =>
    guardarCierre(cliente, cierre),
  );
}

// Caja edita los suyos y el admin cualquiera: la base decide con la sesion.
export async function editarCierreDesdeElPanel(datos: unknown) {
  return ejecutarAccion('caja', esquemaEdicion, datos, ({ cliente }, { id, ...cierre }) =>
    editarCierre(cliente, id, cierre),
  );
}

export async function anularCierreDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', esquemaAnulacionDeCierre, datos, ({ cliente }, { id, motivo }) =>
    anularCierre(cliente, id, motivo),
  );
}

export async function cambiarToleranciaDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', esquemaTolerancia, datos, ({ cliente }, { tolerancia }) =>
    cambiarTolerancia(cliente, centavosDeCaja(tolerancia)!),
  );
}
