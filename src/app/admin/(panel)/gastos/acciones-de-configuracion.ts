'use server';

import { z } from 'zod';
import { ejecutarAccion } from '@/lib/acceso/servidor';
import {
  cambiarEstadoDeCategoria,
  cambiarEstadoDeRecurrente,
  crearCategoria,
  crearRecurrente,
  editarCategoria,
  editarRecurrente,
} from '@/lib/gastos/escritura';
import { esquemaCategoria, esquemaId, esquemaRecurrente } from '@/lib/gastos/esquemas';

const esquemaDeEstado = esquemaId.extend({ activo: z.boolean() });

export async function crearRecurrenteDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', esquemaRecurrente, datos, ({ cliente }, recurrente) =>
    crearRecurrente(cliente, recurrente),
  );
}

export async function editarRecurrenteDesdeElPanel(datos: unknown) {
  const esquema = esquemaRecurrente.extend(esquemaId.shape);
  return ejecutarAccion('admin', esquema, datos, ({ cliente }, { id, ...recurrente }) =>
    editarRecurrente(cliente, id, recurrente),
  );
}

export async function cambiarEstadoDeRecurrenteDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', esquemaDeEstado, datos, ({ cliente }, { id, activo }) =>
    cambiarEstadoDeRecurrente(cliente, id, activo),
  );
}

export async function crearCategoriaDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', esquemaCategoria, datos, ({ cliente }, categoria) =>
    crearCategoria(cliente, categoria),
  );
}

export async function editarCategoriaDesdeElPanel(datos: unknown) {
  const esquema = esquemaCategoria.extend(esquemaId.shape);
  return ejecutarAccion('admin', esquema, datos, ({ cliente }, { id, ...categoria }) =>
    editarCategoria(cliente, id, categoria),
  );
}

export async function cambiarEstadoDeCategoriaDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', esquemaDeEstado, datos, ({ cliente }, { id, activo }) =>
    cambiarEstadoDeCategoria(cliente, id, activo),
  );
}
