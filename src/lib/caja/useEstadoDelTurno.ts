'use client';

import { useCallback, useEffect, useState } from 'react';
import { msHastaLaProximaConsulta, type EstadoDelTurno } from './turnos';

/** El aviso que manda el mostrador cuando la base rechaza una venta por la traba. */
export const EVENTO_DE_LA_TRABA = 'manteca:traba-del-cierre';

type Leer = () => Promise<EstadoDelTurno | null>;

// Pregunta a la hora de corte, al vencer la postergación o al minuto, y al cambiar de pantalla.
function useConsultas(estado: EstadoDelTurno, refrescar: () => void, ruta: string) {
  useEffect(() => {
    const espera = setTimeout(refrescar, msHastaLaProximaConsulta(estado, new Date()));
    return () => clearTimeout(espera);
  }, [estado, refrescar]);
  useEffect(() => {
    const ahora = setTimeout(refrescar, 0);
    return () => clearTimeout(ahora);
  }, [ruta, refrescar]);
  useEffect(() => {
    window.addEventListener(EVENTO_DE_LA_TRABA, refrescar);
    return () => window.removeEventListener(EVENTO_DE_LA_TRABA, refrescar);
  }, [refrescar]);
}

/** El estado del mostrador al día, y también cuando una venta se rechaza por la traba. */
export function useEstadoDelTurno(inicial: EstadoDelTurno, leer: Leer, ruta: string) {
  const [estado, setEstado] = useState(inicial);
  const [traido, setTraido] = useState(inicial);
  // El marco no se vuelve a armar al navegar: lo que trae el servidor lo pone al día.
  if (traido !== inicial) {
    setTraido(inicial);
    setEstado(inicial);
  }
  const refrescar = useCallback(async () => {
    const nuevo = await leer().catch(() => null);
    if (nuevo) setEstado(nuevo);
  }, [leer]);
  useConsultas(estado, refrescar, ruta);
  return { estado, refrescar };
}
