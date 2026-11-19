'use client';

import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { BOTON_ESMERALDA } from '@/components/panel/estilos';
import { medioEnFrase } from '@/lib/caja/titular';
import { formatearPesos } from '@/lib/plata';
import type { EstadoDelCobro } from '@/lib/vender/cobro';
import type { useEleccion } from '@/lib/vender/useMostrador';
import { cn } from '@/lib/utils';
import { ElegirMedio } from './ElegirMedio';

type Eleccion = ReturnType<typeof useEleccion>;
type Partes = { eleccion: Eleccion; cobro: EstadoDelCobro };

// Con dos medios se escribe lo del primero y el resto va con el segundo.
function DosMedios({ eleccion, cobro }: Partes) {
  const { medio, segundoMedio, primeroEscrito } = eleccion.eleccion;
  const segundo = cobro.pagos?.[1];
  return (
    <div className="space-y-3 rounded-2xl border border-border p-3">
      <ElegirMedio
        grupo="Segundo medio"
        elegido={segundoMedio}
        sin={medio}
        elegir={(otro) => eleccion.cambiar({ segundoMedio: otro })}
      />
      {medio ? (
        <Campo
          id="con-el-primero"
          etiqueta={`Con ${medioEnFrase(medio)}`}
          inputMode="decimal"
          placeholder="Ej: 5.000"
          value={primeroEscrito}
          onChange={(e) => eleccion.cambiar({ primeroEscrito: e.target.value })}
        />
      ) : null}
      {segundo ? (
        <p className="text-sm font-semibold">
          Con {medioEnFrase(segundo.medio)}: {formatearPesos(segundo.montoCentavos)}
        </p>
      ) : null}
    </div>
  );
}

// Solo si una parte va en efectivo: con cuánto paga el cliente y el vuelto.
function Efectivo({ eleccion, cobro }: Partes) {
  if (!cobro.pagos?.some((pago) => pago.medio === 'efectivo')) return null;
  return (
    <div className="space-y-2">
      <Campo
        id="paga-con"
        etiqueta="Paga con"
        inputMode="decimal"
        placeholder="Ej: 20.000"
        value={eleccion.pagaCon}
        onChange={(e) => eleccion.setPagaCon(e.target.value)}
      />
      {cobro.vuelto ? <p className="text-sm font-bold">{cobro.vuelto}</p> : null}
    </div>
  );
}

type Props = Partes & {
  totalCentavos: number;
  enviando: boolean;
  mensaje: string | null;
  cobrar: () => void;
};

/** Cómo se cobra y el botón de cobrar, con el total. */
export function CobroDelMostrador({ totalCentavos, eleccion, cobro, ...envio }: Props) {
  const { dosMedios, medio } = eleccion.eleccion;
  return (
    <section
      aria-label="Cobro"
      className="bg-card rounded-[2rem] border border-border/60 shadow-xl p-4 md:p-6 space-y-4"
    >
      <ElegirMedio grupo="Medio de pago" elegido={medio} elegir={eleccion.elegirMedio} />
      <button
        type="button"
        aria-pressed={dosMedios}
        onClick={() => eleccion.cambiar({ dosMedios: !dosMedios })}
        className={cn(
          'h-9 pointer-coarse:h-11 px-3 rounded-xl text-xs font-bold transition-colors',
          dosMedios
            ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
            : 'bg-secondary text-foreground hover:bg-secondary/80',
        )}
      >
        Pagar con dos medios
      </button>
      {dosMedios ? <DosMedios eleccion={eleccion} cobro={cobro} /> : null}
      <Efectivo eleccion={eleccion} cobro={cobro} />
      {cobro.aviso ? <p className="text-xs font-semibold text-amber-700">{cobro.aviso}</p> : null}
      {envio.mensaje ? <AvisoDeError mensaje={envio.mensaje} /> : null}
      <button
        type="button"
        onClick={envio.cobrar}
        disabled={!cobro.pagos || totalCentavos === 0 || envio.enviando}
        className={cn(BOTON_ESMERALDA, 'w-full h-14 text-xs')}
      >
        {envio.enviando ? 'Cobrando...' : `Cobrar ${formatearPesos(totalCentavos)}`}
      </button>
    </section>
  );
}
