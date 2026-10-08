'use server';

import { z } from 'zod';
import { ejecutarAccion } from '@/lib/acceso/servidor';
import { exito } from '@/lib/resultado';
import { esquemaIdDeProveedor, esquemaProveedor } from '@/lib/proveedores/esquemas';
import {
  cambiarEstadoDeProveedor,
  crearProveedor,
  editarProveedor,
} from '@/lib/proveedores/escritura';

export async function crearProveedorDesdeElPanel(datos: unknown) {
  const esquema = esquemaProveedor.extend({ confirmar: z.boolean() });
  return ejecutarAccion('admin', esquema, datos, ({ cliente }, { confirmar, ...proveedor }) =>
    crearProveedor(cliente, proveedor, confirmar),
  );
}

// Editar responde igual que crear: asi el formulario lleva a la ficha en los dos casos.
export async function editarProveedorDesdeElPanel(datos: unknown) {
  const esquema = esquemaProveedor.extend(esquemaIdDeProveedor.shape);
  return ejecutarAccion('admin', esquema, datos, async ({ cliente }, { id, ...proveedor }) => {
    const resultado = await editarProveedor(cliente, id, proveedor);
    return resultado.ok ? exito({ estado: 'creado' as const, id }) : resultado;
  });
}

export async function cambiarEstadoDesdeElPanel(datos: unknown) {
  const esquema = esquemaIdDeProveedor.extend({ activo: z.boolean() });
  return ejecutarAccion('admin', esquema, datos, ({ cliente }, { id, activo }) =>
    cambiarEstadoDeProveedor(cliente, id, activo),
  );
}
