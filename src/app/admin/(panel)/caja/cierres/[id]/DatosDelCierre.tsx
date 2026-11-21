import { ClipboardList } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Cierre } from '@/lib/caja/consultas';
import { diferenciaDeFondo, textoDeFondo, totalDeRetiros } from '@/lib/caja/fondo';
import { formatearPesos } from '@/lib/plata';
import { Bloque } from '../../Piezas';

function Dato({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="space-y-1 py-3 first:pt-0">
      <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{titulo}</dt>
      <dd className="text-sm font-semibold">{children}</dd>
    </div>
  );
}

type Props = {
  cierre: Cierre;
  fondoAnteriorCentavos: number | null;
  postergaciones: string | null;
};

/** Lo demás del cierre, en una columna que se lee de arriba abajo. */
export function DatosDelCierre({ cierre, fondoAnteriorCentavos, postergaciones }: Props) {
  const fondo = diferenciaDeFondo(cierre.fondoInicialCentavos, fondoAnteriorCentavos);
  const gastos = cierre.gastos.filter((g) => !g.anulado);
  return (
    <Bloque titulo="Datos del cierre" icono={ClipboardList}>
      <dl className="divide-y divide-border">
        <Dato titulo="Fondo inicial">
          <span className="tabular-nums">{formatearPesos(cierre.fondoInicialCentavos)}</span>
          {fondo ? (
            <span className="block text-xs font-medium text-rose-600">{textoDeFondo(fondo)}</span>
          ) : null}
        </Dato>
        <Dato titulo="Retiros">
          {cierre.retiros.length === 0 ? (
            <span className="text-muted-foreground">Ninguno</span>
          ) : (
            <ul className="space-y-1">
              {cierre.retiros.map((r, i) => (
                <li key={i} className="flex justify-between gap-3 tabular-nums">
                  <span>{r.quien}</span>
                  <span>{formatearPesos(r.monto_centavos)}</span>
                </li>
              ))}
              <li className="text-xs text-muted-foreground">
                Total {formatearPesos(totalDeRetiros(cierre.retiros))}
              </li>
            </ul>
          )}
        </Dato>
        <Dato titulo="Gastos con la caja">
          {gastos.length === 0 ? (
            <span className="text-muted-foreground">Ninguno</span>
          ) : (
            <ul className="space-y-1">
              {gastos.map((g) => (
                <li key={g.id} className="flex justify-between gap-3 tabular-nums">
                  <span>{g.descripcion ?? 'Gasto'}</span>
                  <span>{formatearPesos(g.monto_centavos)}</span>
                </li>
              ))}
            </ul>
          )}
        </Dato>
        <Dato titulo="Queda en caja">
          <span className="tabular-nums">{formatearPesos(cierre.quedaEnCajaCentavos)}</span>
        </Dato>
        {postergaciones ? <Dato titulo="Postergaciones">{postergaciones}</Dato> : null}
        {cierre.comentario ? (
          <Dato titulo="Comentario">
            <span className="whitespace-pre-line font-normal">{cierre.comentario}</span>
          </Dato>
        ) : null}
      </dl>
    </Bloque>
  );
}
