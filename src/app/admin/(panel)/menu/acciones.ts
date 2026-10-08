'use server';

import { z } from 'zod';
import { ejecutarAccion } from '@/lib/acceso/servidor';
import { exito } from '@/lib/resultado';
import { cambiosDelAumento } from '@/lib/menu/consultas';
import {
  esquemaAplicarAumento,
  esquemaAumento,
  esquemaCategoria,
  esquemaElemento,
  esquemaMover,
  esquemaProducto,
  esquemaVisibilidad,
} from '@/lib/menu/esquemas';
import {
  aplicarAumento,
  cambiarVisibilidad,
  desactivar,
  guardarCategoria,
  guardarProducto,
  mover,
  reactivar,
} from '@/lib/menu/escritura';

const conConfirmacion = { confirmar: z.boolean() };

export async function guardarCategoriaDelMenu(datos: unknown) {
  return ejecutarAccion(
    'admin',
    esquemaCategoria.extend(conConfirmacion),
    datos,
    ({ cliente }, { confirmar, ...categoria }) => guardarCategoria(cliente, categoria, confirmar),
  );
}

export async function guardarProductoDelMenu(datos: unknown) {
  return ejecutarAccion(
    'admin',
    esquemaProducto.extend(conConfirmacion),
    datos,
    ({ cliente }, { confirmar, ...producto }) => guardarProducto(cliente, producto, confirmar),
  );
}

export async function cambiarVisibilidadEnElMenu(datos: unknown) {
  return ejecutarAccion('admin', esquemaVisibilidad, datos, ({ cliente }, validos) =>
    cambiarVisibilidad(cliente, validos),
  );
}

export async function moverEnElMenu(datos: unknown) {
  return ejecutarAccion('admin', esquemaMover, datos, ({ cliente }, validos) =>
    mover(cliente, validos),
  );
}

export async function desactivarEnElMenu(datos: unknown) {
  return ejecutarAccion('admin', esquemaElemento, datos, ({ cliente }, validos) =>
    desactivar(cliente, validos),
  );
}

export async function reactivarEnElMenu(datos: unknown) {
  return ejecutarAccion('admin', esquemaElemento, datos, ({ cliente }, validos) =>
    reactivar(cliente, validos),
  );
}

export async function verCambiosDelAumento(datos: unknown) {
  return ejecutarAccion('admin', esquemaAumento, datos, async ({ cliente }, validos) =>
    exito(await cambiosDelAumento(cliente, validos)),
  );
}

export async function aplicarAumentoDelMenu(datos: unknown) {
  return ejecutarAccion('admin', esquemaAplicarAumento, datos, ({ cliente }, validos) =>
    aplicarAumento(cliente, validos),
  );
}
