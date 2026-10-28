'use server';

import { ejecutarAccion } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import { anularGasto, cargarGasto, clasificarGasto, editarGasto } from '@/lib/gastos/escritura';
import {
  esquemaAnulacion,
  esquemaCarga,
  esquemaClasificacion,
  esquemaDeGastoEditado,
  esquemaPago,
} from '@/lib/gastos/esquemas';
import { anularPorPagar, pagar } from '@/lib/gastos/pagos';

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

export async function clasificarGastoDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', esquemaClasificacion, datos, ({ cliente }, clasificacion) =>
    clasificarGasto(cliente, clasificacion),
  );
}

export async function anularGastoDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', esquemaAnulacion, datos, ({ cliente }, { id, motivo }) =>
    anularGasto(cliente, id, motivo),
  );
}

// La fecha del pago, como la de un gasto, no puede ser futura: hoy lo decide el servidor.
export async function pagarDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', esquemaPago(hoy()), datos, ({ cliente }, pago) =>
    pagar(cliente, pago),
  );
}

export async function anularPorPagarDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', esquemaAnulacion, datos, ({ cliente }, { id, motivo }) =>
    anularPorPagar(cliente, id, motivo),
  );
}
