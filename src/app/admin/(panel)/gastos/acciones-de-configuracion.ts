'use server';

import { z } from 'zod';
import { ejecutarAccion } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import {
  cambiarEstadoDeCategoria,
  cambiarEstadoDeRecurrente,
  crearCategoria,
  editarCategoria,
  editarRecurrente,
} from '@/lib/gastos/escritura';
import { esquemaCategoria, esquemaFijo, esquemaId } from '@/lib/gastos/esquemas';

const esquemaDeEstado = esquemaId.extend({ activo: z.boolean() });

/** Editar un gasto fijo: hoy lo decide el servidor, en Argentina. */
export async function editarFijoDesdeElPanel(datos: unknown) {
  const hoy = diaEnArgentina(new Date());
  const esquema = esquemaFijo(hoy).extend(esquemaId.shape);
  return ejecutarAccion('admin', esquema, datos, ({ cliente }, { id, ...fijo }) =>
    editarRecurrente(cliente, id, fijo, hoy),
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
