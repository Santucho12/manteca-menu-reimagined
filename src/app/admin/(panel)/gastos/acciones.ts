'use server';

import { ejecutarAccion } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import { anularGasto, cargarGasto, editarGasto } from '@/lib/gastos/escritura';
import { esquemaAnulacion, esquemaCarga, esquemaDeGastoEditado } from '@/lib/gastos/esquemas';

// Hoy lo decide el servidor, en Argentina: un gasto suelto no puede tener fecha futura.
const hoy = () => diaEnArgentina(new Date());

export async function cargarGastoDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', esquemaCarga(hoy()), datos, ({ cliente }, carga) =>
    cargarGasto(cliente, carga),
  );
}

export async function editarGastoDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', esquemaDeGastoEditado(hoy()), datos, ({ cliente }, gasto) => {
    const { id, ...cambios } = gasto;
    return editarGasto(cliente, id, cambios);
  });
}

export async function anularGastoDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', esquemaAnulacion, datos, ({ cliente }, { id, motivo }) =>
    anularGasto(cliente, id, motivo),
  );
}
