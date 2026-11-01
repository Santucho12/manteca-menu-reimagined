import type { ReactNode } from 'react';
import { TITULO_DE_COLUMNA } from '@/components/panel/estilos';
import { cn } from '@/lib/utils';

type Titulo = { texto: string; der?: boolean };
type Props = { etiqueta?: string; titulos: Titulo[]; children: ReactNode };

/**
 * La tabla de Plan Reminder Pro para los reportes. Aca las pruebas buscan filas y celdas, asi que
 * es una tabla de verdad (la de las listas lleva roles de lista).
 */
export function TablaDeDatos({ etiqueta, titulos, children }: Props) {
  return (
    <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
      {/* Si un monto no entra en un celular angosto, la tabla se desliza en vez de cortarse. */}
      <div className="overflow-x-auto">
        <table aria-label={etiqueta} className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {titulos.map((t) => (
                <th key={t.texto} className={cn(TITULO_DE_COLUMNA, t.der && 'text-right')}>
                  {t.texto}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

/** Una celda de la tabla; `der` la alinea a la derecha (los montos). */
export function Celda({ der, children }: { der?: boolean; children: ReactNode }) {
  // En el celular, menos aire a los costados: con cuatro columnas de millones no entraban.
  return (
    <td className={cn('py-3 px-2 sm:px-3 align-top text-xs', der && 'text-right')}>{children}</td>
  );
}
