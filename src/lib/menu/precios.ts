export type PrecioGuardado = {
  presentacionId: string;
  productoId: string | null;
  montoCentavos: number;
};
export type PresentacionDelMenu = { id: string; nombre: string };
export type OrigenDelPrecio = 'propio' | 'compartido';
export type PrecioVigente = {
  presentacionId: string;
  presentacion: string;
  montoCentavos: number | null;
  origen: OrigenDelPrecio | null;
};

function vigenteEn(
  productoId: string,
  presentacion: PresentacionDelMenu,
  precios: PrecioGuardado[],
): PrecioVigente {
  const deLaPresentacion = precios.filter((p) => p.presentacionId === presentacion.id);
  const propio = deLaPresentacion.find((p) => p.productoId === productoId);
  const compartido = deLaPresentacion.find((p) => p.productoId === null);
  const origen = propio ? 'propio' : compartido ? 'compartido' : null;
  const montoCentavos = (propio ?? compartido)?.montoCentavos ?? null;
  return {
    presentacionId: presentacion.id,
    presentacion: presentacion.nombre,
    montoCentavos,
    origen,
  };
}

/**
 * El precio de cada presentacion: el propio del producto si lo tiene; si no, el compartido de
 * la categoria. La misma regla que usa la base. Recibe solo precios y presentaciones activos.
 */
export function preciosVigentes(
  productoId: string,
  presentaciones: PresentacionDelMenu[],
  precios: PrecioGuardado[],
): PrecioVigente[] {
  return presentaciones.map((presentacion) => vigenteEn(productoId, presentacion, precios));
}

export function tienePrecio(vigentes: PrecioVigente[]): boolean {
  return vigentes.some((vigente) => vigente.montoCentavos !== null);
}
