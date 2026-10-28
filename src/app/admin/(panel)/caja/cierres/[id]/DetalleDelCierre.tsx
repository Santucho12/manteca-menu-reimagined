import { FranjaDeAviso } from '@/components/panel/Avisos';
import { Dato, Datos, Seccion } from '@/components/panel/Seccion';
import type { Cierre } from '@/lib/caja/consultas';
import { diferenciaDeFondo, textoDeFondo } from '@/lib/caja/fondo';
import { avisoDeQueda } from '@/lib/caja/queda';
import { nombreDeMedio, textoDeDiferencia } from '@/lib/caja/pantalla';
import { formatearPesos } from '@/lib/plata';

const FILA = 'grid grid-cols-1 sm:grid-cols-4 gap-1 sm:items-center py-3 text-sm';

function Medios({ cierre }: { cierre: Cierre }) {
  return (
    <ul className="divide-y divide-border">
      {cierre.medios.map((medio) => (
        <li key={medio.medio} className={FILA}>
          <span className="font-bold">{nombreDeMedio(medio.medio)}</span>
          <span>Declarado: {formatearPesos(medio.declaradoCentavos)}</span>
          <span className="text-muted-foreground">
            Esperado: {formatearPesos(medio.esperadoCentavos)}
          </span>
          <span>{textoDeDiferencia(medio.diferenciaCentavos)}</span>
        </li>
      ))}
    </ul>
  );
}

const FILA_DE_SALIDA = 'flex flex-wrap justify-between gap-2 py-3 text-sm';

function Salidas({ cierre }: { cierre: Cierre }) {
  if (cierre.retiros.length === 0 && cierre.gastos.length === 0) {
    return <p className="text-sm text-muted-foreground">No salió efectivo de la caja.</p>;
  }
  return (
    <ul className="divide-y divide-border">
      {cierre.retiros.map((retiro, i) => (
        <li key={`retiro-${i}`} className={FILA_DE_SALIDA}>
          <span>Retiro · {retiro.quien}</span>
          <span className="font-bold">{formatearPesos(retiro.monto_centavos)}</span>
        </li>
      ))}
      {cierre.gastos.map((gasto) => (
        <li key={gasto.id} className={FILA_DE_SALIDA}>
          <span>Gasto · {gasto.descripcion}</span>
          <span className="font-bold">{formatearPesos(gasto.monto_centavos)}</span>
        </li>
      ))}
    </ul>
  );
}

function Efectivo({ cierre, anterior }: { cierre: Cierre; anterior: number | null }) {
  const fondo = diferenciaDeFondo(cierre.fondoInicialCentavos, anterior);
  const contado = cierre.medios.find((m) => m.medio === 'efectivo')?.declaradoCentavos ?? 0;
  const aviso = avisoDeQueda(contado, cierre.quedaEnCajaCentavos);
  return (
    <Seccion titulo="Efectivo de la caja" forma="lista">
      <Datos>
        <Dato titulo="Fondo inicial" valor={formatearPesos(cierre.fondoInicialCentavos)} />
        <Dato titulo="Efectivo contado" valor={formatearPesos(contado)} />
        <Dato titulo="Queda en la caja" valor={formatearPesos(cierre.quedaEnCajaCentavos)} />
      </Datos>
      {aviso ? (
        <FranjaDeAviso>
          <p>{aviso}</p>
        </FranjaDeAviso>
      ) : null}
      {fondo ? (
        <FranjaDeAviso>
          <p>{textoDeFondo(fondo)}</p>
        </FranjaDeAviso>
      ) : null}
    </Seccion>
  );
}

type Props = { cierre: Cierre; fondoAnterior: number | null };

/** Lo que se declaro en el cierre, lo esperado segun las ventas del dia y la diferencia. */
export function DetalleDelCierre({ cierre, fondoAnterior }: Props) {
  return (
    <>
      <Seccion titulo="Por medio de pago" forma="lista">
        <p className="pb-2 text-xs text-muted-foreground">
          Esperado = fondo inicial + ventas del día − retiros − gastos pagados con la caja (el
          efectivo); en los demás medios, lo vendido con ese medio. Se declara el efectivo total que
          hay en el cajón, fondo incluido.
        </p>
        <Medios cierre={cierre} />
      </Seccion>
      <Efectivo cierre={cierre} anterior={fondoAnterior} />
      <Seccion titulo="Retiros y gastos pagados con la caja" forma="lista">
        <Salidas cierre={cierre} />
      </Seccion>
      {cierre.comentario ? (
        <Seccion titulo="Comentario de quien cargó" forma="lista">
          <p className="text-sm whitespace-pre-line">{cierre.comentario}</p>
        </Seccion>
      ) : null}
    </>
  );
}
