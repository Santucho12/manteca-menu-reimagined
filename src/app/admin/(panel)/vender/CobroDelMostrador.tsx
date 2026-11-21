'use client';

import type { ReactNode } from 'react';
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

type Props = Partes & {
  totalCentavos: number;
  /** Lo que se cobra en una línea: cuántos productos y el tipo de venta. */
  resumen: string;
  /** Al editar una venta (pedido 102): el motivo antes del botón, y el botón dice Guardar. */
  antesDelBoton?: ReactNode;
  boton?: string;
  listo?: boolean;
  /** El botón de descuento, al lado de Pagar con dos medios (pedido 102). */
  descuento?: ReactNode;
  enviando: boolean;
  mensaje: string | null;
  cobrar: () => void;
};

/** Cómo se cobra y el botón de cobrar, con el total. */
export function CobroDelMostrador({
  totalCentavos,
  eleccion,
  cobro,
  resumen,
  antesDelBoton,
  boton = 'Cobrar',
  listo = true,
  descuento,
  ...envio
}: Props) {
  const { dosMedios, medio } = eleccion.eleccion;
  return (
    <section
      aria-label="Cobro"
      className="bg-card rounded-3xl border border-border shadow-[0_10px_30px_-12px_rgba(15,23,42,0.18)] p-4 md:p-6 space-y-5"
    >
      <p className="text-sm font-semibold text-muted-foreground">{resumen}</p>
      <ElegirMedio grupo="Medio de pago" elegido={medio} elegir={eleccion.elegirMedio} />
      <div className="flex flex-wrap gap-2">
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
        {descuento}
      </div>
      {dosMedios ? <DosMedios eleccion={eleccion} cobro={cobro} /> : null}
      {cobro.aviso ? <p className="text-xs font-semibold text-amber-700">{cobro.aviso}</p> : null}
      {antesDelBoton}
      {envio.mensaje ? <AvisoDeError mensaje={envio.mensaje} /> : null}
      <button
        type="button"
        onClick={envio.cobrar}
        disabled={!cobro.pagos || totalCentavos === 0 || envio.enviando || !listo}
        className={cn(BOTON_ESMERALDA, 'w-full h-16 text-sm')}
      >
        {envio.enviando ? 'Guardando...' : `${boton} ${formatearPesos(totalCentavos)}`}
      </button>
    </section>
  );
}
