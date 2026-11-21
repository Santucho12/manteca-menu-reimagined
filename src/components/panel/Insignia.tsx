'use client';

import { insigniaSinDescartados } from '@/lib/inicio/avisosALaVista';
import { useDescartadosDeHoy } from '@/lib/inicio/useDescartados';

// La burbuja roja sobre la esquina del ícono, como las notificaciones de las apps (Santiago,
// 2026-11-20, pedido 102). La misma en la barra lateral y en la de abajo del celular. El número
// queda antes del nombre en el texto ("3 Gastos"), como esperan las pruebas.
export const BURBUJA =
  'absolute -top-1.5 -right-2.5 z-10 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold leading-4 text-center tabular-nums ring-2 ring-card';

/** Lo que espera en una seccion, menos lo de los avisos eliminados hoy en Inicio. */
export function Insignia({ numero, clave }: { numero: number | null; clave?: string }) {
  const { descartados, hoy } = useDescartadosDeHoy();
  const queda = clave ? insigniaSinDescartados(numero, clave, descartados, hoy) : numero;
  if (!queda) return null;
  return <span className={BURBUJA}>{queda}</span>;
}
