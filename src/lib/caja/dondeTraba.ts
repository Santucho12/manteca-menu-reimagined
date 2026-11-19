/**
 * Dónde se ve la ventana del cierre: Caja, en todo salvo Cargar cierre, que tiene que poder usar;
 * el admin, solo en Vender. El resto del panel no toca la caja.
 */
export function trabaEnLaRuta(estado: string, ruta: string): boolean {
  if (estado === 'caja') return ruta !== '/admin/caja';
  if (estado === 'admin') return ruta === '/admin/vender';
  return false;
}
