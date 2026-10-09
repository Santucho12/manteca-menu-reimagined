'use server';

import { ejecutarAccion } from '@/lib/acceso/servidor';
import { anularGasto, crearGasto, editarGasto } from '@/lib/gastos/escritura';
import { esquemaAnulacion, esquemaGasto, esquemaId } from '@/lib/gastos/esquemas';

export async function crearGastoDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', esquemaGasto, datos, ({ cliente }, gasto) =>
    crearGasto(cliente, gasto),
  );
}

export async function editarGastoDesdeElPanel(datos: unknown) {
  const esquema = esquemaGasto.extend(esquemaId.shape);
  return ejecutarAccion('admin', esquema, datos, ({ cliente }, { id, ...gasto }) =>
    editarGasto(cliente, id, gasto),
  );
}

export async function anularGastoDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', esquemaAnulacion, datos, ({ cliente }, { id, motivo }) =>
    anularGasto(cliente, id, motivo),
  );
}
