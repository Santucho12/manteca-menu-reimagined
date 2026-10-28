import { z } from 'zod';

const nombre = z
  .string()
  .trim()
  .min(1, 'Escribí el nombre.')
  .max(100, 'El nombre puede tener hasta 100 caracteres.');
const email = z.string().trim().toLowerCase().pipe(z.email('Escribí un email válido.'));
// El minimo es el mismo que trae Supabase Auth. Supabase guarda la contraseña con bcrypt, que
// solo mira los primeros 72 caracteres.
const contrasenaNueva = z
  .string()
  .min(6, 'La contraseña tiene que tener al menos 6 caracteres.')
  .max(72, 'La contraseña puede tener hasta 72 caracteres.');
const id = z.uuid('La cuenta no es válida.');

export const esquemaRegistro = z.object({ nombre, email, contrasena: contrasenaNueva });
export const esquemaIngreso = z.object({
  email,
  contrasena: z.string().min(1, 'Escribí tu contraseña.'),
});
export const esquemaCambioObligado = z.object({ nueva: contrasenaNueva });
export const esquemaCambioDeContrasena = z.object({
  actual: z.string().min(1, 'Escribí tu contraseña actual.'),
  nueva: contrasenaNueva,
});
export const esquemaCuenta = z.object({ id });
// Encargado existe, pero en esta fase no se asigna.
export const esquemaAsignarRol = z.object({
  id,
  rol: z.enum(['invitado', 'caja', 'admin'], 'Elegí Pendiente, Caja o Admin.'),
});
export const esquemaCorreccion = z.object({ id, nombre, email });

export type DatosDeRegistro = z.infer<typeof esquemaRegistro>;
export type DatosDeIngreso = z.infer<typeof esquemaIngreso>;
export type DatosDeCambioObligado = z.infer<typeof esquemaCambioObligado>;
export type DatosDeCambioDeContrasena = z.infer<typeof esquemaCambioDeContrasena>;
export type DatosDeAsignarRol = z.infer<typeof esquemaAsignarRol>;
export type DatosDeCorreccion = z.infer<typeof esquemaCorreccion>;
