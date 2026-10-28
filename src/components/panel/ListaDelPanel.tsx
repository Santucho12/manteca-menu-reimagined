import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cantidadDeResultados } from '@/lib/panel/lista';
import { cn } from '@/lib/utils';
import { CANTIDAD_DE_RESULTADOS } from './estilos';
import { SoloUnaVista } from './SoloUnaVista';
import { TablaDeFilas, type Columna } from './TablaDeFilas';

export type { Columna };

type Props<T> = {
  /** El nombre de la lista para el lector de pantalla y las pruebas. */
  etiqueta: string;
  icono: LucideIcon;
  total: number;
  filas: T[];
  clave: (fila: T) => string;
  columnas: Columna<T>[];
  /** El contenido de la tarjeta de cada fila en el celular y la tablet. */
  tarjeta: (fila: T) => ReactNode;
};

function Tarjetas<T>({ etiqueta, total, filas, clave, tarjeta }: Props<T>) {
  return (
    <div className="xl:hidden space-y-3">
      <p className={cn('px-1', CANTIDAD_DE_RESULTADOS)}>{cantidadDeResultados(total)}</p>
      <ul aria-label={etiqueta} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filas.map((fila) => (
          <li
            key={clave(fila)}
            className="relative bg-card rounded-2xl border border-border shadow-card p-4 space-y-3"
          >
            {tarjeta(fila)}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * La tabla de Plan Reminder Pro (ClientTable.tsx) desde xl y sus tarjetas por debajo. Las pruebas
 * buscan una lista: la tabla queda igual y cambian solo los roles; se ve identica.
 */
export function ListaDelPanel<T>(props: Props<T>) {
  return <SoloUnaVista tabla={<TablaDeFilas {...props} />} tarjetas={<Tarjetas {...props} />} />;
}
