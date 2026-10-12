import type { ReactNode } from 'react';
import type { Cierre } from '@/lib/caja/consultas';
import { mediosDelCierre, nombreDeMedio, textoDeDiferencia } from '@/lib/caja/pantalla';
import { diferenciaDeFondo, textoDeFondo } from '@/lib/caja/fondo';
import { formatearPesos } from '@/lib/plata';

const pesos = (centavos: number | null) => (centavos === null ? '—' : formatearPesos(centavos));

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-heading text-lg font-semibold">{titulo}</h2>
      {children}
    </section>
  );
}

function Medios({ cierre }: { cierre: Cierre }) {
  return (
    <ul className="bg-card divide-y rounded-xl border">
      {mediosDelCierre(cierre).map((medio) => (
        <li key={medio.medio} className="grid gap-1 p-4 sm:grid-cols-4 sm:items-center">
          <span className="font-medium">{nombreDeMedio(medio.medio)}</span>
          <span>Declarado: {formatearPesos(medio.declaradoCentavos)}</span>
          <span className="text-muted-foreground">Esperado: {pesos(medio.esperadoCentavos)}</span>
          <span>{textoDeDiferencia(medio.diferenciaCentavos)}</span>
        </li>
      ))}
    </ul>
  );
}

function Salidas({ cierre }: { cierre: Cierre }) {
  const nada = cierre.retiros.length === 0 && cierre.gastos.length === 0;
  if (nada) return <p className="text-muted-foreground">No salió efectivo de la caja.</p>;
  return (
    <ul className="bg-card divide-y rounded-xl border">
      {cierre.retiros.map((retiro, i) => (
        <li key={`retiro-${i}`} className="flex flex-wrap justify-between gap-2 p-4">
          <span>Retiro · {retiro.quien}</span>
          <span>{formatearPesos(retiro.monto_centavos)}</span>
        </li>
      ))}
      {cierre.gastos.map((gasto) => (
        <li key={gasto.id} className="flex flex-wrap justify-between gap-2 p-4">
          <span>Gasto · {gasto.descripcion}</span>
          <span>{formatearPesos(gasto.monto_centavos)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Lo que se declaro en el cierre y, cuando entren las ventas, lo esperado y la diferencia. */
export function DetalleDelCierre({
  cierre,
  fondoAnterior,
}: {
  cierre: Cierre;
  fondoAnterior: number | null;
}) {
  const fondo = diferenciaDeFondo(cierre.fondo_inicial_centavos, fondoAnterior);
  return (
    <div className="space-y-6">
      {cierre.estado === 'esperando_ventas' ? (
        <p className="text-muted-foreground">
          Lo esperado y la diferencia van a estar cuando entren las ventas de ese día.
        </p>
      ) : null}
      <Seccion titulo="Por medio de pago">
        <Medios cierre={cierre} />
      </Seccion>
      <Seccion titulo="Efectivo de la caja">
        <p>Fondo inicial: {formatearPesos(cierre.fondo_inicial_centavos)}</p>
        <p>Queda en la caja: {formatearPesos(cierre.queda_en_caja_centavos)}</p>
        {fondo ? <p className="font-medium">{textoDeFondo(fondo)}</p> : null}
      </Seccion>
      <Seccion titulo="Retiros y gastos pagados con la caja">
        <Salidas cierre={cierre} />
      </Seccion>
      {cierre.comentario ? (
        <Seccion titulo="Comentario de quien cargó">
          <p className="whitespace-pre-line">{cierre.comentario}</p>
        </Seccion>
      ) : null}
    </div>
  );
}
