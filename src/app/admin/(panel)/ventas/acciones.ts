'use server';

import { z } from 'zod';
import { ejecutarAccion } from '@/lib/acceso/servidor';
import {
  anularVenta,
  borrarCanal,
  cambiarEstadoDeCanal,
  crearCanal,
  editarCanal,
  ordenarCanales,
} from '@/lib/ventas/escritura';
import { esquemaEdicionDeVenta } from '@/lib/ventas/edicion';
import { editarVenta } from '@/lib/ventas/editar';
import { esquemaAnulacionDeVenta, esquemaCanal } from '@/lib/ventas/esquemas';

const conId = z.object({ id: z.uuid() });

// Caja también edita: la base le deja solo las de los últimos 30 minutos (pedido 102).
export async function editarVentaDesdeElPanel(datos: unknown) {
  return ejecutarAccion('caja', esquemaEdicionDeVenta, datos, ({ cliente }, edicion) =>
    editarVenta(cliente, edicion),
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

export async function ordenarCanalesDesdeElPanel(datos: unknown) {
  const esquema = z.object({ ids: z.array(z.uuid()).min(1).max(200) });
  return ejecutarAccion('admin', esquema, datos, ({ cliente }, { ids }) =>
    ordenarCanales(cliente, ids),
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
