'use server';

import { ejecutarAccion } from '@/lib/acceso/servidor';
import {
  anularCierre,
  cambiarTolerancia,
  guardarCierre,
  revisarCierre,
} from '@/lib/caja/escritura';
import {
  centavosDeCaja,
  esquemaAnulacionDeCierre,
  esquemaCierre,
  esquemaRevision,
  esquemaTolerancia,
} from '@/lib/caja/esquemas';

// Caja y Admin: el cierre queda a nombre de quien tiene la sesion, la base no deja elegir.
export async function guardarCierreDesdeElPanel(datos: unknown) {
  return ejecutarAccion('caja', esquemaCierre, datos, ({ cliente }, cierre) =>
    guardarCierre(cliente, cierre),
  );
}

export async function revisarCierreDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', esquemaRevision, datos, ({ cliente }, { id, comentario }) =>
    revisarCierre(cliente, id, comentario),
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
