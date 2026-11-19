import { InsigniaDeEstado } from '@/components/panel/Insignias';
import { FALTA_EL_DATO } from '@/components/panel/estilos';
import { textoDelPorcentaje } from '@/lib/costos/calculo';
import type { PresentacionConCosto } from '@/lib/costos/consultas';
import { formatearPesos } from '@/lib/plata';

const pesos = (centavos: number | null) => (centavos === null ? '—' : formatearPesos(centavos));

function Numero({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{titulo}</p>
      <p className="text-sm font-bold whitespace-nowrap">{valor}</p>
    </div>
  );
}

function Presentacion({ fila }: { fila: PresentacionConCosto }) {
  return (
    <div className="rounded-xl bg-secondary/40 p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold">{fila.nombre}</p>
        {fila.debajo ? <InsigniaDeEstado tono="rosa">Debajo del mínimo</InsigniaDeEstado> : null}
      </div>
      {fila.costo === null ? (
        <p className={FALTA_EL_DATO}>{fila.motivo}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Numero titulo="Costo" valor={pesos(fila.costo)} />
          <Numero titulo="Precio" valor={pesos(fila.precio)} />
          <Numero titulo="Ganancia" valor={pesos(fila.ganancia)} />
          <Numero
            titulo="Porcentaje"
            valor={fila.porcentaje === null ? '—' : textoDelPorcentaje(fila.porcentaje)}
          />
          <Numero titulo="Precio sugerido" valor={pesos(fila.sugerido)} />
        </div>
      )}
      {fila.costo !== null && fila.motivo ? <p className={FALTA_EL_DATO}>{fila.motivo}</p> : null}
    </div>
  );
}

/** Cada presentacion de un producto con su costo, su precio y lo que deja. */
export function Presentaciones({ filas }: { filas: PresentacionConCosto[] }) {
  return (
    <div className="space-y-2">
      {filas.map((fila) => (
        <Presentacion key={fila.presentacionId} fila={fila} />
      ))}
    </div>
  );
}
