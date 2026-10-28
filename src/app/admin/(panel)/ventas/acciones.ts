'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ejecutarAccion, exigirAccion } from '@/lib/acceso/servidor';
import { exito } from '@/lib/resultado';
import { archivoDelFormulario, mensajeDeLaSubida } from '@/lib/ventas/mensajesDeLaSubida';
import { guardarSubida, vistaDeLaSubida } from '@/lib/ventas/subidaDeFudo';
import {
  anularVenta,
  borrarCanal,
  cambiarEstadoDeCanal,
  crearCanal,
  editarCanal,
  guardarVenta,
} from '@/lib/ventas/escritura';
import { esquemaAnulacionDeVenta, esquemaCanal, esquemaVenta } from '@/lib/ventas/esquemas';

const conId = z.object({ id: z.uuid() });

/** Revisa el archivo de Fudo y dice que entraria, sin guardar nada. */
export async function revisarExcelDeFudo(datos: FormData) {
  const acceso = await exigirAccion('admin');
  if (!acceso.ok) return acceso;
  const archivo = await archivoDelFormulario(datos);
  return archivo.ok ? vistaDeLaSubida(archivo.datos) : archivo;
}

/** Guarda las ventas del archivo de Fudo. */
export async function guardarExcelDeFudo(datos: FormData) {
  const acceso = await exigirAccion('admin');
  if (!acceso.ok) return acceso;
  const archivo = await archivoDelFormulario(datos);
  if (!archivo.ok) return archivo;
  const resultado = await guardarSubida(acceso.datos.cliente, archivo.datos);
  revalidatePath('/admin', 'layout');
  return resultado.ok ? exito(mensajeDeLaSubida(resultado.datos)) : resultado;
}

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
