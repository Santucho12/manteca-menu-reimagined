import { AlertTriangle } from 'lucide-react';
import { BOTON_CANCELAR, BOTON_PRINCIPAL } from '@/components/panel/estilos';

type Props = {
  productos: string[];
  enviando: boolean;
  alConfirmar: () => void;
  alVolver: () => void;
};

/** Guardar deja productos sin precio: se pregunta antes de ocultarlos (la confirmacion de Plan Reminder Pro). */
export function ConfirmacionDeOcultar({ productos, enviando, alConfirmar, alVolver }: Props) {
  return (
    <div
      role="alertdialog"
      aria-labelledby="aviso-de-ocultar"
      className="space-y-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-2">
          <p id="aviso-de-ocultar" className="text-sm font-semibold">
            Estos productos se van a ocultar porque quedan sin precio:
          </p>
          <ul className="list-disc pl-5 text-sm">
            {productos.map((nombre) => (
              <li key={nombre}>{nombre}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <button type="button" onClick={alVolver} className={BOTON_CANCELAR}>
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
