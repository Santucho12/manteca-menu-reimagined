import { AlertTriangle } from 'lucide-react';
import { BOTON_CANCELAR, BOTON_PELIGRO, BOTON_PRINCIPAL } from '@/components/panel/estilos';
import { CONFIRMAR, preguntaDe, type AccionConConfirmacion } from '@/lib/usuarios/pantalla';

type Props = {
  accion: AccionConConfirmacion;
  nombre: string;
  enviando: boolean;
  alConfirmar: () => void;
  alCancelar: () => void;
};

/** La pregunta antes de una accion que no se deshace sola, dentro de la misma tarjeta. */
export function Confirmacion({ accion, nombre, enviando, alConfirmar, alCancelar }: Props) {
  const peligrosa = CONFIRMAR[accion].variante === 'destructive';
  return (
    <div className="space-y-4 rounded-2xl border border-blue-300 bg-blue-50 p-4 text-blue-900">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm font-semibold">{preguntaDe(accion, nombre)}</p>
      </div>
      <div className="flex flex-col-reverse gap-3 max-sm:[&>*]:flex-none sm:flex-row">
        <button type="button" disabled={enviando} onClick={alCancelar} className={BOTON_CANCELAR}>
          Cancelar
        </button>
        <button
          type="button"
          disabled={enviando}
          onClick={alConfirmar}
          className={`${peligrosa ? `${BOTON_PELIGRO} h-12` : BOTON_PRINCIPAL} justify-center`}
        >
          {CONFIRMAR[accion].texto}
        </button>
      </div>
    </div>
  );
}
