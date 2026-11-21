import { AlertTriangle } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { BOTON_PRINCIPAL, BOTON_SUAVE } from '@/components/panel/estilos';

type Props = {
  titulo: string;
  children: ReactNode;
  enviando: boolean;
  alConfirmar: () => void;
  alVolver: () => void;
};

/** Un aviso que frena el guardado hasta confirmar (la confirmacion de Plan Reminder Pro). */
export function AvisoParaConfirmar({ titulo, children, enviando, alConfirmar, alVolver }: Props) {
  const id = useId();
  return (
    <div
      role="alertdialog"
      aria-labelledby={id}
      className="space-y-4 rounded-2xl border border-blue-300 bg-blue-50 p-4 text-blue-900"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-2">
          <p id={id} className="text-sm font-semibold">
            {titulo}
          </p>
          {children}
        </div>
      </div>
      <div className="flex flex-col-reverse gap-3 max-sm:[&>*]:flex-none sm:flex-row">
        <button type="button" onClick={alVolver} className={BOTON_SUAVE}>
          Volver
        </button>
        <button
          type="button"
          disabled={enviando}
          onClick={alConfirmar}
          className={`${BOTON_PRINCIPAL} justify-center`}
        >
          Confirmar
        </button>
      </div>
    </div>
  );
}
