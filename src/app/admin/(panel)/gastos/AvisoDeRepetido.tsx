import { AlertTriangle } from 'lucide-react';
import { BOTON_PRINCIPAL } from '@/components/panel/estilos';
import { MENSAJE_DE_REPETIDO } from '@/lib/gastos/esquemas';

type Props = { enviando: boolean; alConfirmar: () => void };

/** Puede ser un gasto cargado dos veces; no bloquea: puede haber dos compras iguales el mismo día. */
export function AvisoDeRepetido({ enviando, alConfirmar }: Props) {
  return (
    <div
      role="alertdialog"
      aria-labelledby="gasto-repetido"
      className="space-y-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
        <p id="gasto-repetido" className="text-sm font-semibold">
          {MENSAJE_DE_REPETIDO} ¿Lo cargás igual?
        </p>
      </div>
      <button type="button" disabled={enviando} onClick={alConfirmar} className={BOTON_PRINCIPAL}>
        Cargar igual
      </button>
    </div>
  );
}
