import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cantidadDeResultados } from '@/lib/panel/lista';
import { cn } from '@/lib/utils';
import { CANTIDAD_DE_RESULTADOS, TITULO_DE_COLUMNA } from './estilos';
import { FilaAnimada } from './FilaAnimada';

export type Columna<T> = {
  titulo: string;
  icono?: LucideIcon;
  alinear?: 'der' | 'centro';
  /** La columna se esconde por debajo de este ancho. */
  desde?: 'lg' | '2xl';
  celda: (fila: T) => ReactNode;
};

type Props<T> = {
  etiqueta: string;
  icono: LucideIcon;
  /** El color del ícono de la cabecera: por defecto el de marca. */
  colorDelIcono?: string;
  total: number;
  filas: T[];
  clave: (fila: T) => string;
  columnas: Columna<T>[];
};

const ALINEAR = { der: 'text-right', centro: 'text-center', izq: 'text-left' };
const DESDE = { lg: 'hidden lg:table-cell', '2xl': 'hidden 2xl:table-cell' };
const clasesDe = (c: { alinear?: 'der' | 'centro'; desde?: 'lg' | '2xl' }, base: string) =>
  cn(base, ALINEAR[c.alinear ?? 'izq'], c.desde && DESDE[c.desde]);

function Titulos<T>({ columnas }: { columnas: Columna<T>[] }) {
  return (
    <thead aria-hidden="true">
      <tr className="border-b border-border bg-muted/30">
        {columnas.map((c) => (
          <th key={c.titulo} className={clasesDe(c, TITULO_DE_COLUMNA)}>
            <div
              className={cn(
                'flex items-center gap-2',
                c.alinear === 'der' && 'justify-end',
                c.alinear === 'centro' && 'justify-center',
              )}
            >
              {c.icono ? <c.icono size={12} /> : null}
              {c.titulo}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}

/** La tabla de Plan Reminder Pro, desde xl: cabecera con el contador y filas que aparecen. */
export function TablaDeFilas<T>({
  etiqueta,
  icono: Icono,
  colorDelIcono = 'text-primary',
  total,
  filas,
  clave,
  columnas,
}: Props<T>) {
  return (
    <div className="hidden xl:block bg-card rounded-2xl shadow-premium border border-border overflow-hidden animate-in-slide">
      <div className="px-6 py-5 border-b border-border bg-secondary/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icono size={18} className={colorDelIcono} aria-hidden="true" />
          <h2 className="text-base font-bold tracking-tight uppercase text-muted-foreground/80">
            {etiqueta}
          </h2>
        </div>
        <div className={cn('flex items-center gap-4', CANTIDAD_DE_RESULTADOS)}>
          <span className="px-2 py-1 bg-secondary rounded-md">{cantidadDeResultados(total)}</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table role="presentation" className="w-full border-collapse">
          <Titulos columnas={columnas} />
          <tbody role="list" aria-label={etiqueta} className="divide-y divide-border">
            {filas.map((fila) => (
              <FilaAnimada key={clave(fila)}>
                {columnas.map((c) => (
                  <td key={c.titulo} className={clasesDe(c, 'px-3 py-2.5')}>
                    <span className="sr-only">{c.titulo}: </span>
                    {c.celda(fila)}
                  </td>
                ))}
              </FilaAnimada>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
