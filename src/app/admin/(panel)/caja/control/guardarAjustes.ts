import type { AjustesDeCaja } from '@/lib/caja/ajustes';
import { cambiarHorasDesdeElPanel, cambiarToleranciaDesdeElPanel } from '../acciones';

/** Un solo Guardar: primero las horas y, si salieron bien, la tolerancia. */
export async function guardarAjustes({ mediodia, noche, tolerancia }: AjustesDeCaja) {
  const horas = await cambiarHorasDesdeElPanel({ mediodia, noche });
  if (!horas.ok) return horas;
  return cambiarToleranciaDesdeElPanel({ tolerancia });
}
