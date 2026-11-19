'use server';

import { z } from 'zod';
import { ejecutarAccion } from '@/lib/acceso/servidor';
import {
  cambiarEstadoDeForma,
  cambiarEstadoDeInsumo,
  crearFormaDeCompra,
  crearInsumo,
  editarFormaDeCompra,
  editarInsumo,
} from '@/lib/materia-prima/escritura';
import {
  esquemaFormaDeCompra,
  esquemaIdDeInsumo,
  esquemaInsumo,
} from '@/lib/materia-prima/esquemas';
import { exito } from '@/lib/resultado';

const conEstado = esquemaIdDeInsumo.extend({ activo: z.boolean() });

export async function crearInsumoDesdeElPanel(datos: unknown) {
  const esquema = esquemaInsumo.extend({ confirmar: z.boolean() });
  return ejecutarAccion('admin', esquema, datos, ({ cliente }, { confirmar, ...insumo }) =>
    crearInsumo(cliente, insumo, confirmar),
  );
}

// Editar responde igual que crear: asi el formulario lleva a la ficha en los dos casos.
export async function editarInsumoDesdeElPanel(datos: unknown) {
  const esquema = esquemaInsumo.extend(esquemaIdDeInsumo.shape);
  return ejecutarAccion('admin', esquema, datos, async ({ cliente }, { id, ...insumo }) => {
    const resultado = await editarInsumo(cliente, id, insumo);
    return resultado.ok ? exito({ estado: 'creado' as const, id }) : resultado;
  });
}

export async function cambiarEstadoDeInsumoDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', conEstado, datos, ({ cliente }, { id, activo }) =>
    cambiarEstadoDeInsumo(cliente, id, activo),
  );
}

export async function crearFormaDesdeElPanel(datos: unknown) {
  const esquema = esquemaFormaDeCompra.extend({ insumoId: z.uuid() });
  return ejecutarAccion('admin', esquema, datos, ({ cliente }, { insumoId, ...forma }) =>
    crearFormaDeCompra(cliente, insumoId, forma),
  );
}

export async function editarFormaDesdeElPanel(datos: unknown) {
  const esquema = esquemaFormaDeCompra.extend(esquemaIdDeInsumo.shape);
  return ejecutarAccion('admin', esquema, datos, async ({ cliente }, { id, ...forma }) => {
    const resultado = await editarFormaDeCompra(cliente, id, forma);
    return resultado.ok ? exito({ id }) : resultado;
  });
}

export async function cambiarEstadoDeFormaDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', conEstado, datos, ({ cliente }, { id, activo }) =>
    cambiarEstadoDeForma(cliente, id, activo),
  );
}
