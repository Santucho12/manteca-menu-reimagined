export const BUCKET_DE_FOTOS = 'fotos-del-menu';
export const TAMANIO_MAXIMO_DE_FOTO = 10 * 1024 * 1024;

const EXTENSIONES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as const;
export type TipoDeFoto = keyof typeof EXTENSIONES;

/** Las fotos de la carga inicial viven en public/menu; las que sube el admin, en el bucket. */
export function urlDeFoto(foto: string | null, urlDeSupabase: string): string | null {
  if (!foto) return null;
  if (foto.startsWith('/')) return foto;
  return `${urlDeSupabase}/storage/v1/object/public/${BUCKET_DE_FOTOS}/${foto}`;
}

export function esTipoDeFoto(tipo: string): tipo is TipoDeFoto {
  return tipo in EXTENSIONES;
}

/** Por que no se puede subir un archivo, o null si se puede. */
export function problemaDeFoto(tipo: string, bytes: number): string | null {
  if (!esTipoDeFoto(tipo)) return 'Subí una foto JPG, PNG o WebP.';
  if (bytes > TAMANIO_MAXIMO_DE_FOTO) return 'La foto pesa más de 10 MB. Probá con una más chica.';
  return null;
}

/** La base solo acepta fotos dentro de la carpeta del local de quien guarda. */
export function rutaDeFoto(localId: string, tipo: TipoDeFoto, id: string): string {
  return `${localId}/${id}.${EXTENSIONES[tipo]}`;
}
