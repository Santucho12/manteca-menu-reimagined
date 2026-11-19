import type { FieldErrors } from 'react-hook-form';
import { Campo } from '@/components/formularios/Campo';
import type { DatosDeCierre } from '@/lib/caja/esquemas';
import type { Registro } from '@/lib/formularios/valorInicial';
import { CAMPO_CONTRASTADO } from './contraste';

export type TipoControlado = { canalId: string; nombre: string };

type Props = {
  tipos: TipoControlado[];
  registro: Registro<DatosDeCierre>;
  errors: FieldErrors<DatosDeCierre>;
};

/**
 * Después de la caja, lo que dice la facturación de cada tipo de venta que se controla. A ciegas:
 * lo cargado en el sistema se ve recién al guardar (pedido 99).
 */
export function ControlesPorTipo({ tipos, registro, errors }: Props) {
  if (tipos.length === 0) return null;
  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-bold">Por tipo de venta</legend>
      {tipos.map((tipo, i) => (
        <div
          key={tipo.canalId}
          className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_1fr] items-end"
        >
          <p className="text-sm font-semibold">{tipo.nombre}</p>
          <Campo
            className={CAMPO_CONTRASTADO}
            id={`control-${i}-total`}
            etiqueta={`Facturado en ${tipo.nombre}`}
            inputMode="decimal"
            error={errors.controles?.[i]?.total?.message}
            {...registro(`controles.${i}.total`)}
          />
          <Campo
            className={CAMPO_CONTRASTADO}
            id={`control-${i}-cantidad`}
            etiqueta={`Ventas de ${tipo.nombre} (opcional)`}
            inputMode="numeric"
            error={errors.controles?.[i]?.cantidad?.message}
            {...registro(`controles.${i}.cantidad`)}
          />
        </div>
      ))}
    </fieldset>
  );
}
