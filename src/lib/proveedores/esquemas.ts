import { z } from 'zod';
import type { Proveedor } from './consultas';
import { normalizarTelefono, telefonoParaMostrar } from './telefono';

const opcional = (maximo: number) =>
  z.string().trim().max(maximo, `Usá hasta ${maximo} caracteres.`);

export const esquemaProveedor = z.object({
  nombre: z.string().trim().min(1, 'Escribí el nombre.').max(100, 'Usá hasta 100 caracteres.'),
  telefono: z
    .string()
    .refine(
      (texto) => normalizarTelefono(texto) !== undefined,
      'Escribí el número con la característica y sin el 15, por ejemplo 11 2345 6789.',
    ),
  ubicacion: opcional(200),
  queCompra: opcional(200),
  observaciones: opcional(1000),
});

export const esquemaIdDeProveedor = z.object({ id: z.uuid() });

export type DatosDeProveedor = z.infer<typeof esquemaProveedor>;

const vacioANulo = (texto: string) => (texto.trim() === '' ? null : texto.trim());

/** La fila que se guarda: sin local, que lo pone la base con la sesion. */
export function proveedorParaLaBase(datos: DatosDeProveedor) {
  return {
    nombre: datos.nombre.trim(),
    telefono: normalizarTelefono(datos.telefono) ?? null,
    ubicacion: vacioANulo(datos.ubicacion),
    que_compra: vacioANulo(datos.queCompra),
    observaciones: vacioANulo(datos.observaciones),
  };
}

/** El formulario de edicion: el telefono legible, que el esquema vuelve a entender. */
export function datosParaEditar(proveedor: Proveedor): DatosDeProveedor {
  return {
    nombre: proveedor.nombre,
    telefono: proveedor.telefono ? telefonoParaMostrar(proveedor.telefono) : '',
    ubicacion: proveedor.ubicacion ?? '',
    queCompra: proveedor.que_compra ?? '',
    observaciones: proveedor.observaciones ?? '',
  };
}
