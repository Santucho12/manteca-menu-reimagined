import { exito, fallo, type Resultado } from '../resultado';
import type { Cliente } from '../supabase/cliente';
import { BUCKET_DE_FOTOS, esTipoDeFoto, problemaDeFoto, rutaDeFoto } from './fotos';

/** Sube la foto con la sesion de quien la elige, directo a Storage: no pasa por el servidor. */
export async function subirFoto(
  cliente: Cliente,
  localId: string,
  archivo: File,
): Promise<Resultado<string>> {
  const problema = problemaDeFoto(archivo.type, archivo.size);
  if (problema || !esTipoDeFoto(archivo.type))
    return fallo(problema ?? 'Subí una foto JPG, PNG o WebP.');
  const ruta = rutaDeFoto(localId, archivo.type, crypto.randomUUID());
  const { error } = await cliente.storage
    .from(BUCKET_DE_FOTOS)
    .upload(ruta, archivo, { contentType: archivo.type });
  return error ? fallo('No pudimos subir la foto. Probá de nuevo.') : exito(ruta);
}
