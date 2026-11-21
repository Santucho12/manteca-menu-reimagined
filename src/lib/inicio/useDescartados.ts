'use client';

import { useSyncExternalStore } from 'react';
import { diaEnArgentina } from '../fechas';
import type { Aviso } from './avisos';
import { conUnDescartado, sinDescartados, type Descartados } from './avisosALaVista';

// v2: los eliminados guardan cuánto restan del menú lateral.
const CLAVE = 'manteca.avisosDescartados.v2';

const EVENTO = 'manteca:avisos-descartados';

// Es una comodidad de este equipo: si el navegador no deja guardar, el aviso vuelve al recargar.
function leerTexto(): string {
  try {
    return localStorage.getItem(CLAVE) ?? 'null';
  } catch {
    return 'null';
  }
}

function suscribir(avisar: () => void) {
  window.addEventListener(EVENTO, avisar);
  return () => window.removeEventListener(EVENTO, avisar);
}

/** Lo eliminado hoy en este equipo; lo comparten Inicio y el menú lateral. */
export function useDescartadosDeHoy() {
  const texto = useSyncExternalStore(suscribir, leerTexto, () => 'null');
  return { descartados: JSON.parse(texto) as Descartados | null, hoy: diaEnArgentina(new Date()) };
}

/** Los avisos que quedan a la vista y cómo eliminar uno con el tacho (Santiago, 2026-11-20). */
export function useDescartados(avisos: Aviso[]) {
  const { descartados, hoy } = useDescartadosDeHoy();
  const descartar = (aviso: Aviso) => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(conUnDescartado(descartados, aviso, hoy)));
    } catch {}
    window.dispatchEvent(new Event(EVENTO));
  };
  return { quedan: sinDescartados(avisos, descartados, hoy), descartar };
}
