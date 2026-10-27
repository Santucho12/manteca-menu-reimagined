export type AvisoDeProximamente = { seccion: string; id: number };

let aviso: AvisoDeProximamente | null = null;
let contador = 0;
const oyentes = new Set<() => void>();

const avisarALosOyentes = () => oyentes.forEach((oyente) => oyente());

/** Muestra el aviso de una sección que todavía no está lista; uno nuevo reemplaza al anterior. */
export function mostrarProximamente(seccion: string): void {
  contador += 1;
  aviso = { seccion, id: contador };
  avisarALosOyentes();
}

export function cerrarProximamente(): void {
  aviso = null;
  avisarALosOyentes();
}

export const leerProximamente = () => aviso;

export function suscribirseAProximamente(oyente: () => void): () => void {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}
