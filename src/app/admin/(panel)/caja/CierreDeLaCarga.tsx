'use client';

import { Lock, MessageSquareText, Receipt } from 'lucide-react';
import type { FieldErrors } from 'react-hook-form';
import { Campo } from '@/components/formularios/Campo';
import { CampoDeTextoLargo } from '@/components/formularios/CampoDeTextoLargo';
import type { DatosDeCierre } from '@/lib/caja/esquemas';
import type { Registro } from '@/lib/formularios/valorInicial';
import { Bloque } from './Piezas';

export type TipoControlado = { canalId: string; nombre: string };

type Props = {
  registro: Registro<DatosDeCierre>;
  errors: FieldErrors<DatosDeCierre>;
  tipos: TipoControlado[];
};

/** Con cuánto efectivo queda la caja para el turno siguiente. */
export function QuedaEnCaja({ registro, errors }: Omit<Props, 'tipos'>) {
  return (
    <Bloque
      titulo="Queda en caja"
      ayuda="El efectivo que se deja para arrancar el turno siguiente."
      icono={Lock}
      tono="violeta"
    >
      <Campo
        id="quedaEnCaja"
        etiqueta="Queda en caja"
        inputMode="decimal"
        error={errors.quedaEnCaja?.message}
        {...registro('quedaEnCaja')}
      />
    </Bloque>
  );
}

/** Lo que dice la facturación de cada tipo de venta que se controla; a ciegas, sin lo del sistema. */
export function TiposDeLaCarga({ registro, errors, tipos }: Props) {
  if (tipos.length === 0) return null;
  return (
    <Bloque
      titulo="Tipos de venta"
      ayuda="Cuánto se facturó en cada uno, según su propio sistema."
      icono={Receipt}
      tono="naranja"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {tipos.map((tipo, i) => (
          <Campo
            key={tipo.canalId}
            id={`control-${i}-total`}
            etiqueta={`Facturado en ${tipo.nombre}`}
            inputMode="decimal"
            error={errors.controles?.[i]?.total?.message}
            {...registro(`controles.${i}.total`)}
          />
        ))}
      </div>
    </Bloque>
  );
}

/** Algo para dejar anotado del turno. */
export function ComentarioDeLaCarga({ registro, errors }: Omit<Props, 'tipos'>) {
  return (
    <Bloque titulo="Comentario" ayuda="Opcional." icono={MessageSquareText}>
      <CampoDeTextoLargo
        id="comentario"
        etiqueta="Comentario (opcional)"
        error={errors.comentario?.message}
        {...registro('comentario')}
      />
    </Bloque>
  );
}
