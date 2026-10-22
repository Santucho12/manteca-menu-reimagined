import { Save } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { BOTON_CANCELAR, BOTON_PRINCIPAL } from '@/components/panel/estilos';

type Props = {
  enviando: boolean;
  texto?: string;
  /** Adonde vuelve "Cancelar"; sin esto no hay boton. */
  cancelar?: string;
  extra?: ReactNode;
};

/** Los botones al pie de un formulario: el principal de Plan Reminder Pro y, si se pide, Cancelar. */
export function PieDelFormulario({ enviando, texto = 'Guardar', cancelar, extra }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="submit" disabled={enviando} className={BOTON_PRINCIPAL}>
        <Save size={14} aria-hidden="true" />
        {enviando ? 'Guardando...' : texto}
      </button>
      {cancelar ? (
        <Link href={cancelar} className={`${BOTON_CANCELAR} flex-none px-6`}>
          Cancelar
        </Link>
      ) : null}
      {extra}
    </div>
  );
}
