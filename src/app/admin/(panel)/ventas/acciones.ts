'use server';

import { z } from 'zod';
import { ejecutarAccion } from '@/lib/acceso/servidor';
import {
  anularVenta,
  borrarCanal,
  cambiarControlDeCanal,
  cambiarEstadoDeCanal,
  crearCanal,
  editarCanal,
  guardarVenta,
} from '@/lib/ventas/escritura';
import { esquemaAnulacionDeVenta, esquemaCanal, esquemaVenta } from '@/lib/ventas/esquemas';

const conId = z.object({ id: z.uuid() });

export async function guardarVentaDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', esquemaVenta, datos, ({ cliente }, venta) =>
    guardarVenta(cliente, venta),
  );
}

export async function anularVentaDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', esquemaAnulacionDeVenta, datos, ({ cliente }, { id, motivo }) =>
    anularVenta(cliente, id, motivo),
  );
}

export async function crearCanalDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', esquemaCanal, datos, ({ cliente }, canal) =>
    crearCanal(cliente, canal),
  );
}

export async function editarCanalDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', esquemaCanal.extend(conId.shape), datos, ({ cliente }, canal) =>
    editarCanal(cliente, canal.id, canal),
  );
}

export async function borrarCanalDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', conId, datos, ({ cliente }, { id }) => borrarCanal(cliente, id));
}

export async function cambiarEstadoDeCanalDesdeElPanel(datos: unknown) {
  const esquema = conId.extend({ activo: z.boolean() });
  return ejecutarAccion('admin', esquema, datos, ({ cliente }, { id, activo }) =>
    cambiarEstadoDeCanal(cliente, id, activo),
  );
}

// Solo el admin elige qué tipos de venta se controlan en el cierre (pedido 99).
export async function cambiarControlDeCanalDesdeElPanel(datos: unknown) {
  const esquema = conId.extend({ controla: z.boolean() });
  return ejecutarAccion('admin', esquema, datos, ({ cliente }, { id, controla }) =>
    cambiarControlDeCanal(cliente, id, controla),
  );
}
