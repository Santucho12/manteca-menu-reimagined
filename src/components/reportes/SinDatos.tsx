import { SinResultados } from '@/components/panel/SinResultados';

/** Lo que se muestra en vez de una tabla vacia. */
export function SinDatos({ children }: { children: string }) {
  return <SinResultados titulo="Sin datos" texto={children} />;
}
