export const MENSAJES_DEL_MENU = {
  sinPermiso: 'No tenés permiso para hacer esto.',
  sinPrecio: 'Cargale un precio para mostrarlo en el menú.',
  categoriaConProductos: 'Primero mové o desactivá estos productos',
  categoriaDesactivada: 'Reactivá primero su categoría.',
  preciosCambiaron: 'Los precios cambiaron mientras mirabas. Revisá los cambios de nuevo.',
  datosAjenos: 'Eso ya no está disponible. Recargá la página e intentá de nuevo.',
  yaCambio: 'Eso ya cambió o no está disponible. Recargá la página e intentá de nuevo.',
  generico: 'No pudimos guardarlo. Revisá los datos e intentá de nuevo.',
} as const;

export type ErrorDeLaBase = { code?: string | null; details?: string | null } | null | undefined;

// La base da PM100 sin permiso y tambien cuando no encuentra lo que se pidio. Al panel solo
// llega un admin activo (el servidor frena antes al resto): para el, PM100 es que otro admin
// lo cambio o lo desactivo en el medio.
const POR_CODIGO: Record<string, string> = {
  PM100: MENSAJES_DEL_MENU.yaCambio,
  '42501': MENSAJES_DEL_MENU.sinPermiso,
  PM102: MENSAJES_DEL_MENU.sinPrecio,
  PM104: MENSAJES_DEL_MENU.categoriaDesactivada,
  PM105: MENSAJES_DEL_MENU.preciosCambiaron,
  PM106: MENSAJES_DEL_MENU.datosAjenos,
};

/** Los nombres que manda la base en el detalle de PM101 y PM103. */
export function nombresDelDetalle(error: ErrorDeLaBase): string[] {
  try {
    const lista: unknown = JSON.parse(error?.details ?? '[]');
    return Array.isArray(lista) ? lista.filter((n): n is string => typeof n === 'string') : [];
  } catch {
    return [];
  }
}

export function mensajeDelMenu(error: ErrorDeLaBase): string {
  if (error?.code === 'PM103') {
    return `${MENSAJES_DEL_MENU.categoriaConProductos}: ${nombresDelDetalle(error).join(', ')}.`;
  }
  return POR_CODIGO[error?.code ?? ''] ?? MENSAJES_DEL_MENU.generico;
}
