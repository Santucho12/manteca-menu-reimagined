'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { arrancarScrollSuave, volverArriba } from '@/lib/panel/scrollSuave';

/** El scroll suave de Plan Reminder Pro, una sola vez, y arriba de todo en cada pantalla. */
export function ScrollSuave() {
  const ruta = usePathname();
  useEffect(() => arrancarScrollSuave(), []);
  useEffect(() => volverArriba(), [ruta]);
  return null;
}
