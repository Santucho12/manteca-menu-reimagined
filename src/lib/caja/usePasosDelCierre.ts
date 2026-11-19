'use client';

import { useState } from 'react';
import type { FieldPath } from 'react-hook-form';
import type { DatosDeCierre } from './esquemas';
import { camposDelPaso, pasoSiguiente, pasosDelCierre } from './pasosDelCierre';

type Validar = (campos: FieldPath<DatosDeCierre>[]) => Promise<boolean>;

/** En qué paso del cierre se está; avanza solo si lo del paso está bien cargado. */
export function usePasosDelCierre(cantidadDeTipos: number, validar: Validar) {
  const pasos = pasosDelCierre(cantidadDeTipos);
  const [actual, setActual] = useState(0);
  const paso = pasos[actual] ?? { tipo: 'caja' };
  const avanzar = async () => {
    if (!(await validar(camposDelPaso(paso)))) return;
    setActual((i) => pasoSiguiente(i, 1, pasos.length));
  };
  const volver = () => setActual((i) => pasoSiguiente(i, -1, pasos.length));
  const volverALaCaja = () => setActual(0);
  return {
    paso,
    numero: actual + 1,
    total: pasos.length,
    avanzar,
    volver,
    volverALaCaja,
  };
}
