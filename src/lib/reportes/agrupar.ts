import { diasDe, sumarDias, type Periodo } from './periodos';

export type Escala = 'dia' | 'mes';
export type Punto = { clave: string; montoCentavos: number; cantidad: number };
export type PuntoSuperpuesto = {
  posicion: number;
  etiqueta: string;
  actual: number | null;
  comparacion: number | null;
};

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const escalaDe = (periodo: Periodo): Escala => (diasDe(periodo) <= 62 ? 'dia' : 'mes');

/** Por dia quedan como estan; por mes se suman los dias de cada mes. */
export function agrupar(puntos: Punto[], escala: Escala): Punto[] {
  if (escala === 'dia') return puntos;
  const meses = new Map<string, Punto>();
  for (const p of puntos) {
    const clave = p.clave.slice(0, 7);
    const previo = meses.get(clave) ?? { clave, montoCentavos: 0, cantidad: 0 };
    meses.set(clave, {
      clave,
      montoCentavos: previo.montoCentavos + p.montoCentavos,
      cantidad: previo.cantidad + p.cantidad,
    });
  }
  return [...meses.values()];
}

function mesSiguiente(mes: string): string {
  const [anio, numero] = mes.split('-').map(Number) as [number, number];
  return numero === 12 ? `${anio + 1}-01` : `${anio}-${String(numero + 1).padStart(2, '0')}`;
}

function siguiente(clave: string, escala: Escala): string {
  return escala === 'dia' ? sumarDias(clave, 1) : mesSiguiente(clave);
}

/** Cada dia o cada mes del periodo, en orden. */
export function clavesDe(periodo: Periodo, escala: Escala): string[] {
  const largo = escala === 'dia' ? 10 : 7;
  const ultima = periodo.hasta.slice(0, largo);
  const claves: string[] = [];
  for (let c = periodo.desde.slice(0, largo); c <= ultima; c = siguiente(c, escala)) {
    claves.push(c);
  }
  return claves;
}

export function etiquetaDe(clave: string, escala: Escala): string {
  if (escala === 'dia') return `${clave.slice(8, 10)}/${clave.slice(5, 7)}`;
  return `${MESES[Number(clave.slice(5, 7)) - 1]} ${clave.slice(0, 4)}`;
}

type Lado = { periodo: Periodo; puntos: Punto[] };

function montosDe(lado: Lado, escala: Escala): number[] {
  const montos = new Map(agrupar(lado.puntos, escala).map((p) => [p.clave, p.montoCentavos]));
  return clavesDe(lado.periodo, escala).map((clave) => montos.get(clave) ?? 0);
}

// Un dia o un mes que todavia no llego no vendio cero: no tiene punto.
const yaPaso = (clave: string, hoy: string | undefined) =>
  !hoy || clave <= hoy.slice(0, clave.length);

/**
 * Los dos periodos uno sobre otro: el dia 1 de cada uno en la misma posicion. Con hoy, lo
 * que viene despues queda sin punto.
 */
export function serieSuperpuesta(
  actual: Lado,
  comparado: Lado,
  escala: Escala,
  hoy?: string,
): PuntoSuperpuesto[] {
  const otros = montosDe(comparado, escala);
  const claves = clavesDe(actual.periodo, escala);
  return montosDe(actual, escala).map((monto, i) => ({
    posicion: i + 1,
    etiqueta: etiquetaDe(claves[i]!, escala),
    actual: yaPaso(claves[i]!, hoy) ? monto : null,
    comparacion: otros[i] ?? null,
  }));
}
